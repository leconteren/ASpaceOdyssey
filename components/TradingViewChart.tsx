
import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
  theme?: 'light' | 'dark';
  height?: number;
  interval?: string; // D, W, M, 60, 240, etc.
}

/**
 * TradingView 免费图表组件
 * 使用 TradingView 官方提供的免费 Widget
 */
export function TradingViewChart({
  symbol,
  theme = 'light',
  height = 400,
  interval = 'D',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 清除旧的 widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol.includes(':') ? symbol : `NASDAQ:${symbol}`,
      interval: interval,
      timezone: 'Asia/Shanghai',
      theme: theme,
      style: '1',
      locale: 'zh_CN',
      enable_publishing: false,
      allow_symbol_change: true,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'],
    });

    containerRef.current.appendChild(script);
  }, [symbol, theme, interval]);

  return (
    <div className="tradingview-widget-container" style={{ height }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

/**
 * TradingView Mini 图表 (适合卡片内显示)
 */
export function TradingViewMiniChart({
  symbol,
  theme = 'light',
  height = 200,
}: {
  symbol: string;
  theme?: 'light' | 'dark';
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol.includes(':') ? symbol : `NASDAQ:${symbol}`,
      width: '100%',
      height: height,
      locale: 'zh_CN',
      dateRange: '3M',
      colorTheme: theme,
      isTransparent: false,
      autosize: true,
    });

    containerRef.current.appendChild(script);
  }, [symbol, theme, height]);

  return <div ref={containerRef} />;
}

/**
 * TradingView 技术分析仪表盘
 */
export function TradingViewTechnicalAnalysis({
  symbol,
  theme = 'light',
  height = 450,
}: {
  symbol: string;
  theme?: 'light' | 'dark';
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: '1D',
      width: '100%',
      height: height,
      symbol: symbol.includes(':') ? symbol : `NASDAQ:${symbol}`,
      showIntervalTabs: true,
      locale: 'zh_CN',
      colorTheme: theme,
    });

    containerRef.current.appendChild(script);
  }, [symbol, theme, height]);

  return <div ref={containerRef} />;
}

/**
 * TradingView 公司财务数据
 */
export function TradingViewFinancials({
  symbol,
  theme = 'light',
  height = 830,
}: {
  symbol: string;
  theme?: 'light' | 'dark';
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      isTransparent: false,
      largeChartUrl: '',
      displayMode: 'regular',
      width: '100%',
      height: height,
      symbol: symbol.includes(':') ? symbol : `NASDAQ:${symbol}`,
      locale: 'zh_CN',
    });

    containerRef.current.appendChild(script);
  }, [symbol, theme, height]);

  return <div ref={containerRef} />;
}

export default TradingViewChart;
