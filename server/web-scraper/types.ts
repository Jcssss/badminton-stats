export type WeekRankInfo = {
    week?: string,
    rank: string,
    points: string,
}

export type PlayerRankData = {
    playerFull: string, 
    rank: WeekRankInfo
}

export type MatchData = {
    result: 'W' | 'L',
    scores: [string, string, string] | [string, string],
    opponents: [string] | [string, string],
    partner: string
}

export type TournamentData = {
    name: string,
    sdate: string,
    edate: string,
    matchesWon: number,
    matchesTotal: number,
    winRate: number,
    matches: MatchData,
} | {}