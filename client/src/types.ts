export type GraphData = Object[];

export type PlayerGraphData = {
    games: GraphData,
    rank: GraphData
}

export type AggregateNumbers = {
    avg: number,
    max: number,
    min: number,
}

export type PlayerSummaryData = {
    name?: string,
    country?: string, 
    overallWinLoss?: {
        wins: number,
        losses: number
    },
    yearlyWinLoss?: {
        wins: number,
        losses: number
    },
    points?: AggregateNumbers,
    rank?: AggregateNumbers,
}