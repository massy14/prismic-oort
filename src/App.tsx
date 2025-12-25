import React, { useState, useEffect } from 'react';
import './index.css';

interface DreamResult {
  imageUrl: string;
  interpretation: string;
  fortune: string;
  luckyItem: string;
}

const App: React.FC = () => {
  const [dream, setDream] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<DreamResult | null>(null);
  const [showSettings, setShowSettings] = useState(!apiKey);

  const SAMPLE_RESULT: DreamResult = {
    imageUrl: 'https://images.metmuseum.org/CRDImages/as/web-large/DP141071.jpg',
    interpretation: 'あなたの夢は、力強いエネルギーと前進の象徴です。大波を乗り越える小舟のように、困難に直面しても確かな技術と勇気を持って進むことで、大きな幸運を掴み取ることができるでしょう。',
    fortune: '大吉',
    luckyItem: '富士山の置産'
  };

  useEffect(() => {
    localStorage.setItem('openai_api_key', apiKey);
  }, [apiKey]);

  const generateWithAI = async () => {
    if (!dream.trim()) return;

    setIsGenerating(true);
    setResult(null);

    // APIキーがない場合はサンプルを表示
    if (!apiKey) {
      setTimeout(() => {
        setResult(SAMPLE_RESULT);
        setIsGenerating(false);
      }, 2000);
      return;
    }

    try {
      // 1. ChatGPTによる夢解釈と運勢生成
      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'あなたは夢占い師です。ユーザーの夢を「浮世絵」のイメージで解釈し、その夢に基づいた新年の運勢を占ってください。返信は必ず以下の純粋なJSON形式(マークダウンなし)にしてください: {"interpretation": "解釈文", "fortune": "大吉などの運勢", "luckyItem": "ラッキーアイテム"}'
            },
            { role: 'user', content: dream }
          ],
          response_format: { type: 'json_object' }
        })
      });

      const gptData = await gptResponse.json();
      if (gptData.error) throw new Error(gptData.error.message);
      const parsed = JSON.parse(gptData.choices[0].message.content);

      // 2. DALL-Eによる画像生成
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `A traditional Japanese Ukiyoe style painting of: ${dream}. Luxury, masterpiece, vibrant colors, New Year theme, gold leaf accents.`,
          n: 1,
          size: '1024x1024'
        })
      });

      const imageData = await imageResponse.json();
      if (imageData.error) throw new Error(imageData.error.message);

      setResult({
        imageUrl: imageData.data[0].url,
        interpretation: parsed.interpretation,
        fortune: parsed.fortune,
        luckyItem: parsed.luckyItem
      });
    } catch (error: any) {
      alert('エラーが発生しました: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>初夢AI絵巻</h1>
        <span className="sub-title">Hatsuyume AI Emaki</span>
        <button
          className="settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', padding: '0.3rem 0.6rem', cursor: 'pointer', borderRadius: '4px' }}
        >
          {showSettings ? '閉じる' : '設定'}
        </button>
      </header>

      {showSettings && (
        <div className="card fade-in" style={{ marginBottom: '1rem', borderStyle: 'dashed' }}>
          <h3>OpenAI API設定</h3>
          <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>夢の生成にはOpenAIのAPIキーが必要です。</p>
          <input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-gold-light)' }}
          />
          <button className="btn-primary" onClick={() => setShowSettings(false)} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>保存</button>
        </div>
      )}

      {!result && !isGenerating && (
        <main className="card fade-in">
          <div className="input-group">
            <p style={{ marginBottom: '1rem', textAlign: 'center' }}>
              昨夜、あるいは最近見た夢の内容を教えてください。<br />
              AIがその夢を絵巻へと描き出し、新年の運勢を占います。
            </p>
            <textarea
              placeholder="例：富士山の上を白い龍に乗って飛んでいた..."
              value={dream}
              onChange={(e) => setDream(e.target.value)}
            />
            <button
              className="btn-primary"
              onClick={generateWithAI}
              disabled={!dream.trim()}
            >
              {!apiKey ? 'サンプルで紡ぐ' : '絵巻を紡ぐ'}
            </button>
          </div>
        </main>
      )}

      {isGenerating && (
        <div className="card fade-in" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>絵巻を執筆中...</p>
          <div className="loading-spinner">
            <div className="lantern">🏮</div>
          </div>
          <p style={{ marginTop: '1rem', opacity: 0.7 }}>これには数十秒かかる場合があります。</p>
        </div>
      )}

      {result && (
        <div className="emaki-view fade-in">
          <h2 style={{ color: 'var(--color-crimson)', textAlign: 'center', marginBottom: '1rem' }}>其の壱：夢の形</h2>
          <img src={result.imageUrl} alt="Generated Dream" className="generated-image" />

          <div className="interpretation card">
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-gold)' }}>AIによる夢解釈</h3>
            <p>{result.interpretation}</p>
          </div>

          <div className="card omikuji-box fade-in">
            <h3 style={{ color: 'var(--color-ink)' }}>令和七年 運勢</h3>
            <span className="daikichi">{result.fortune}</span>
            <p>ラッキーアイテム：{result.luckyItem}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setResult(null);
                  setDream('');
                }}
              >
                別の夢を紡ぐ
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>
        <p style={{ color: 'var(--color-washi)', textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>
          &copy; 2025 初夢AI絵巻製作委員会
        </p>
      </footer>
    </div>
  );
};

export default App;
