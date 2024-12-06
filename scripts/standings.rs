use std::fs;
use std::env;
use std::process;
use crate::time_grabber::time_grabber;
use crate::calculate_standings::calculate_standings;

const ACTIVE_SEASON: &str = "s5";

pub const POINTSLESS_RESULTS: [&str; 2] = ["DNF", "DSQ"];

async fn generate_standings() {
    let args: Vec<String> = env::args().collect();

    if args.len() > 1 && args[1] == "add" {
        let parsed_results = time_grabber(
            &args[2],
            &args[3],
            &args[4]
        ).await;

        let results_path = format!("src/data/results/{}.json", args[2]);
        let results_file = fs::read_to_string(&results_path).expect("Unable to read file");
        let mut results_json: serde_json::Value = serde_json::from_str(&results_file).expect("Unable to parse JSON");

        results_json[&args[3]] = serde_json::to_value(parsed_results).expect("Unable to convert to JSON");

        fs::write(&results_path, serde_json::to_string(&results_json).expect("Unable to write JSON")).expect("Unable to write file");
    }

    let standings_results = calculate_standings(ACTIVE_SEASON);

    let standings = serde_json::to_string(&standings_results.0).expect("Unable to convert to JSON");
    let standings_path = format!("src/data/standings/{}.json", ACTIVE_SEASON);

    fs::write(&standings_path, standings).expect("Unable to write file");
    println!("{} standings data saved to file successfully.", ACTIVE_SEASON);

    let constructors = serde_json::to_string(&standings_results.1).expect("Unable to convert to JSON");
    let constructors_path = format!("src/data/constructorsStandings/{}.json", ACTIVE_SEASON);

    fs::write(&constructors_path, constructors).expect("Unable to write file");
    println!("{} constructors data saved to file successfully.", ACTIVE_SEASON);
}

#[tokio::main]
async fn main() {
    generate_standings().await;
}
