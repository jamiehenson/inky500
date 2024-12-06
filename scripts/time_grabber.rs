use std::collections::HashMap;
use reqwest;
use scraper::{Html, Selector};
use chrono::{DateTime, Utc};
use serde_json::json;

fn format_date(date_string: &str) -> String {
    let date = DateTime::parse_from_rfc3339(date_string).unwrap();
    let month_names = [
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
    ];
    let day = date.day();
    let month = month_names[date.month0() as usize];
    let year = date.year();

    let get_ordinal = |n: u32| -> &str {
        let s = ["th", "st", "nd", "rd"];
        let v = n % 100;
        s[(v - 20) % 10] || s[v] || s[0]
    };

    format!("{} {}{}, {}", month, day, get_ordinal(day), year)
}

pub async fn time_grabber(season: &str, race: &str, link: &str) -> serde_json::Value {
    let response = reqwest::get(link).await.unwrap().text().await.unwrap();
    let document = Html::parse_document(&response);

    let date_selector = Selector::parse("h1 + *").unwrap();
    let date_element = document.select(&date_selector).next().map(|e| e.inner_html());
    let date = date_element.map(|d| format_date(&d));

    let table_selector = Selector::parse("table").unwrap();
    let table = document.select(&table_selector).next();

    let mut results: HashMap<String, String> = HashMap::new();
    let mut fastest_lap = json!({
        "racerId": "unknown",
        "time": "23:59:999"
    });
    let mut highest_lap_count = 0;

    if let Some(table) = table {
        let rows = table.select(&Selector::parse("tr").unwrap()).skip(1);
        let mut lap_counter = 0;

        for (index, row) in rows.enumerate() {
            let cells: Vec<_> = row.select(&Selector::parse("td").unwrap()).collect();
            let driver = cells.get(1).map(|e| e.inner_html()).unwrap_or_default();
            let total_time = cells.get(3).map(|e| e.inner_html()).unwrap_or_default();
            let num_laps = cells.get(4).map(|e| e.inner_html()).unwrap_or_default();
            let best_lap = cells.get(5).map(|e| e.inner_html()).unwrap_or_default();

            let name = drivers.iter().find(|(_, driver)| driver.table_names.contains(&driver)).map(|(name, _)| name).unwrap_or(&driver).to_string();

            let mut parsed_time = total_time.split(':').skip(1).collect::<Vec<_>>().join(":");

            if num_laps.parse::<i32>().unwrap_or(0) > highest_lap_count {
                highest_lap_count = num_laps.parse::<i32>().unwrap_or(0);
            } else if num_laps.parse::<i32>().unwrap_or(0) <= highest_lap_count - 5 {
                parsed_time = "DNF".to_string();
            } else {
                if index > 0 {
                    let previous_time = rows.get(index - 1).map(|r| r.select(&Selector::parse("td").unwrap()).nth(3).map(|e| e.inner_html()).unwrap_or_default()).unwrap_or_default();
                    parsed_time = ((DateTime::parse_from_rfc3339(&format!("2000-01-01T{}Z", total_time)).unwrap().timestamp_millis() - DateTime::parse_from_rfc3339(&format!("2000-01-01T{}Z", previous_time)).unwrap().timestamp_millis()) / 1000).to_string();
                }

                if parsed_time.starts_with('-') {
                    lap_counter += 1;
                    parsed_time = format!("{} lap{}", lap_counter, if lap_counter == 1 { "" } else { "s" });
                } else if lap_counter > 0 {
                    parsed_time = format!("{} lap{}", lap_counter, if lap_counter == 1 { "" } else { "s" });
                }
            }

            results.insert(name.clone(), parsed_time);

            if best_lap != "00:00.000" && DateTime::parse_from_rfc3339(&format!("2000-01-01T00:{}Z", best_lap)).unwrap().timestamp_millis() < DateTime::parse_from_rfc3339(&format!("2000-01-01T00:{}Z", fastest_lap["time"].as_str().unwrap())).unwrap().timestamp_millis() {
                fastest_lap["time"] = json!(best_lap);
                fastest_lap["racerId"] = json!(name);
            }
        }
    }

    let results_keys: Vec<_> = results.keys().cloned().collect();
    let mut copy = results_keys.clone();
    for (index, result) in copy.iter().enumerate() {
        if let Some(penalty) = grid_penalties.get(season).and_then(|r| r.get(race)).and_then(|p| p.get(result)) {
            results_keys.remove(index);
            results_keys.insert((index as i32 + penalty) as usize, result.clone());
        }
    }

    let ordered_results: HashMap<_, _> = results_keys.into_iter().map(|k| (k.clone(), results[&k].clone())).collect();

    json!({
        "results": ordered_results,
        "fastestLap": fastest_lap,
        "data": link,
        "date": date
    })
}
