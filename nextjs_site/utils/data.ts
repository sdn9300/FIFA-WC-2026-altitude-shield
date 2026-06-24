import Papa from "papaparse";

export interface MatchData {
  match_id?: string;
  date?: string;
  venue?: string;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  altitude_m?: number;
  temperature_c?: number;
  humidity_pct?: number;
  [key: string]: any;
}

export async function loadMatchData(): Promise<MatchData[]> {
  try {
    const response = await fetch("/data/team_match_master.csv");
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    const csvText = await response.text();
    const parsed = Papa.parse<MatchData>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    return parsed.data;
  } catch (error) {
    console.error("Error loading match data:", error);
    return [];
  }
}
