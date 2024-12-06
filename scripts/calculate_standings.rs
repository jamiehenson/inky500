use std::collections::HashMap;
use crate::data::{points_penalties, results, season_racers};
use crate::types::{SeasonName, TrackName, RacerName};
use crate::standings::pointsless_results;
use crate::data::results::RaceResults;
use crate::points::points_scheme;
use crate::data::penalties::Penalties;

type GeneratedRaceStandings = HashMap<String, i32>;
type GeneratedStandings = HashMap<String, Option<GeneratedRaceStandings>>;

const STANDARD_DRIVER_COUNT: i32 = 2;

pub fn calculate_standings(season: SeasonName) -> (HashMap<String, HashMap<String, HashMap<String, i32>>>, HashMap<String, HashMap<String, HashMap<String, i32>>>) {
    let season_races: Vec<&str> = results[season].keys().collect();
    let mut driver_points: HashMap<String, HashMap<String, HashMap<String, i32>>> = HashMap::new();
    let mut constructor_points: HashMap<String, HashMap<String, HashMap<String, i32>>> = HashMap::new();

    let points: GeneratedStandings = season_races.iter().fold(HashMap::new(), |mut races_obj, &race| {
        let race_results = results[season].get(race).unwrap_or(&None);

        let pts = if let Some(race_results) = race_results {
            race_results.results.iter().enumerate().fold(HashMap::new(), |mut obj, (current_index, (driver, result))| {
                let dnf = pointsless_results.contains(result);
                let cumulative_points = (points_scheme[season][current_index] as i32)
                    + if race_results.fastest_lap.as_ref().map_or(false, |fl| fl.racer_id == *driver) { 1 } else { 0 }
                    - points_penalties[season][race].get(driver).cloned().unwrap_or(0);

                obj.insert(driver.clone(), if dnf { 0 } else { cumulative_points });
                obj
            })
        } else {
            None
        };

        races_obj.insert(race.to_string(), pts);
        races_obj
    });

    let race_keys: Vec<&str> = points.keys().map(|k| k.as_str()).collect();

    for (index, &race) in race_keys.iter().enumerate() {
        if points[race].is_none() {
            continue;
        }

        let race_points = points[race].as_ref().unwrap();
        let previous_race_points = if index > 0 { points[race_keys[index - 1]].as_ref().unwrap() } else { &HashMap::new() };
        let race_points_keys: Vec<&str> = race_points.keys().map(|k| k.as_str()).collect();

        for driver in race_points_keys.iter() {
            let season_racer = season_racers[season].get(*driver).unwrap_or(&None);
            let car = season_racer.and_then(|sr| sr.other_teams.get(race)).map_or_else(|| season_racer.map_or("unknown", |sr| sr.car.as_str()), |ot| ot.car.as_str());
            let added_constructor_points = constructor_points.get(race).and_then(|cp| cp.get(car)).map_or(0, |cp| cp.points) + race_points[*driver];

            constructor_points.entry(race.to_string()).or_insert_with(HashMap::new).entry(car.to_string()).or_insert_with(|| HashMap::new()).insert("points".to_string(), added_constructor_points);
            constructor_points.entry(race.to_string()).or_insert_with(HashMap::new).entry(car.to_string()).or_insert_with(|| HashMap::new()).insert("normalised_points".to_string(), added_constructor_points);
            constructor_points.entry(race.to_string()).or_insert_with(HashMap::new).entry(car.to_string()).or_insert_with(|| HashMap::new()).insert("driver_count".to_string(), constructor_points.get(race).and_then(|cp| cp.get(car)).map_or(0, |cp| cp.driver_count) + 1);
            constructor_points.entry(race.to_string()).or_insert_with(HashMap::new).entry(car.to_string()).or_insert_with(|| HashMap::new()).insert("delta".to_string(), 0);

            if index > 0 {
                race_points.insert(driver.to_string(), race_points[driver] + previous_race_points.get(driver).cloned().unwrap_or(0));
            }
        }

        if index > 0 {
            for driver in season_racers[season].keys() {
                if !race_points_keys.contains(&driver.as_str()) {
                    race_points.insert(driver.to_string(), previous_race_points.get(driver).cloned().unwrap_or(0));
                }
            }
        }

        if let Some(constructor_points_race) = constructor_points.get_mut(race) {
            for (constructor, points) in constructor_points_race.iter_mut() {
                points.insert("normalised_points".to_string(), (points["points"] as f32 * (STANDARD_DRIVER_COUNT as f32 / points["driver_count"] as f32)).round() as i32);
            }

            let cumulative_points: Vec<_> = constructor_points_race.iter_mut().map(|(constructor, points)| {
                if index > 0 {
                    points.insert("points".to_string(), points["points"] + constructor_points[race_keys[index - 1]].get(constructor).map_or(0, |cp| cp["points"]));
                    points.insert("normalised_points".to_string(), points["normalised_points"] + constructor_points[race_keys[index - 1]].get(constructor).map_or(0, |cp| cp["normalised_points"]));
                }
                (constructor.clone(), points.clone())
            }).collect();

            if index > 0 {
                let missed: Vec<_> = constructor_points[race_keys[index - 1]].keys().filter(|constructor| !cumulative_points.iter().any(|(c, _)| c == *constructor)).cloned().collect();
                for constructor in missed {
                    cumulative_points.push((constructor.clone(), constructor_points[race_keys[index - 1]].get(&constructor).unwrap().clone()));
                }
            }

            *constructor_points_race = cumulative_points.into_iter().sorted_by(|(_, a), (_, b)| b["normalised_points"].cmp(&a["normalised_points"])).collect();
        }

        *points.get_mut(race).unwrap() = race_points.iter().sorted_by(|(_, a), (_, b)| b.cmp(a)).map(|(k, v)| (k.clone(), *v)).collect();

        let driver_keys: Vec<&str> = points[race].keys().map(|k| k.as_str()).collect();
        let previous_driver_keys: Vec<&str> = if index > 0 { points[race_keys[index - 1]].keys().map(|k| k.as_str()).collect() } else { driver_keys.clone() };

        for driver in driver_keys.iter() {
            let delta = previous_driver_keys.iter().position(|&d| d == *driver).unwrap_or(0) as i32 - driver_keys.iter().position(|&d| d == *driver).unwrap_or(0) as i32;

            driver_points.entry(race.to_string()).or_insert_with(HashMap::new).entry(driver.to_string()).or_insert_with(|| HashMap::new()).insert("points".to_string(), points[race][*driver]);
            driver_points.entry(race.to_string()).or_insert_with(HashMap::new).entry(driver.to_string()).or_insert_with(|| HashMap::new()).insert("delta".to_string(), if index > 0 { delta } else { 0 });
        }

        let constructor_keys: Vec<&str> = constructor_points[race].keys().map(|k| k.as_str()).collect();
        let constructor_previous_keys: Vec<&str> = if index > 0 { constructor_points[race_keys[index - 1]].keys().map(|k| k.as_str()).collect() } else { constructor_keys.clone() };

        for constructor in constructor_keys.iter() {
            let delta = constructor_previous_keys.iter().position(|&c| c == *constructor).unwrap_or(0) as i32 - constructor_keys.iter().position(|&c| c == *constructor).unwrap_or(0) as i32;

            constructor_points.entry(race.to_string()).or_insert_with(HashMap::new).entry(constructor.to_string()).or_insert_with(|| HashMap::new()).insert("delta".to_string(), if index > 0 { delta } else { 0 });
        }
    }

    (driver_points, constructor_points)
}
