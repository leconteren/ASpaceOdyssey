// Vercel Serverless Function - Yahoo Finance Quote Proxy
// 避免 CORS 问题，通过服务端请求 Yahoo Finance API

import type { VercelRequest, VercelResponse } from '@vercel/node';

const YAHOO_QUOTE_API = 'https://query1.finance.yahoo.com/v7/finance/quote';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing symbol parameter' });
  }

  try {
    const response = await fetch(`${YAHOO_QUOTE_API}?symbols=${symbol}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`);
    }

    const data = await response.json();
    const quote = data?.quoteResponse?.result?.[0];

    if (!quote) {
      return res.status(404).json({ error: 'Symbol not found' });
    }

    // 返回需要的字段
    return res.status(200).json({
      symbol: quote.symbol,
      shortName: quote.shortName,
      longName: quote.longName,
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketChange: quote.regularMarketChange,
      regularMarketChangePercent: quote.regularMarketChangePercent,
      regularMarketVolume: quote.regularMarketVolume,
      regularMarketDayHigh: quote.regularMarketDayHigh,
      regularMarketDayLow: quote.regularMarketDayLow,
      regularMarketOpen: quote.regularMarketOpen,
      regularMarketPreviousClose: quote.regularMarketPreviousClose,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      marketCap: quote.marketCap,
      trailingPE: quote.trailingPE,
      forwardPE: quote.forwardPE,
      priceToBook: quote.priceToBook,
      trailingEps: quote.trailingEps,
      forwardEps: quote.forwardEps,
      bookValue: quote.bookValue,
      fiftyDayAverage: quote.fiftyDayAverage,
      twoHundredDayAverage: quote.twoHundredDayAverage,
      sharesOutstanding: quote.sharesOutstanding,
      beta: quote.beta,
      dividendYield: quote.dividendYield,
    });
  } catch (error: any) {
    console.error('Yahoo Finance API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch quote' });
  }
}
