import { useState, useEffect, useRef } from 'react'
import './App.css'
import alarmSound from './asset/alarm.mp3'
import { PRESETS } from './data/presets';

function App() {
  const [totalTime, setTotalTime] = useState(PRESETS[0].duration) // 분 단위
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].duration * 60) // 초 단위
  const [isRunning, setIsRunning] = useState(false)
  const [alertInterval, setAlertInterval] = useState(30) // 분 단위
  const [notification, setNotification] = useState(null) // 화면 알림 메시지
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0].name);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // 알림 표시 함수 (화면 알림 + 소리 재생 2회)
  const triggerNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000); // 3초 후 사라짐

    // 소리 설정이 켜져 있을 때만 오디오 재생
    if (isSoundEnabled) {
      const audio = new Audio(alarmSound);
      audioRef.current = audio;
      let playCount = 0;

      const playAudio = () => {
        audio.play().catch(error => console.error("Audio playback failed:", error));
      };

      audio.addEventListener('ended', () => {
        playCount++;
        if (playCount < 2) {
          playAudio();
        } else {
          audioRef.current = null;
        }
      });

      playAudio();
    }
  };

  // 초기 시간 설정
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(totalTime * 60);
    }
  }, [totalTime, isRunning]);

  // 프리셋 변경 핸들러
  const handlePresetChange = (e) => {
    const presetName = e.target.value;
    setSelectedPreset(presetName);
    const preset = PRESETS.find(p => p.name === presetName);
    if (preset) {
      setTotalTime(preset.duration);
    }
  };

  // 타이머 로직
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            triggerNotification("시험 종료!");
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // 알림 체크 로직
  useEffect(() => {
    if (isRunning && timeLeft > 0 && timeLeft < totalTime * 60) {
      const elapsedSeconds = (totalTime * 60) - timeLeft;
      const intervalSeconds = alertInterval * 60;

      if (elapsedSeconds % intervalSeconds === 0 && elapsedSeconds !== 0) {
        const elapsedMinutes = elapsedSeconds / 60;
        triggerNotification(`${elapsedMinutes}분 경과 확인!`);
      }
    }
  }, [timeLeft, isRunning, totalTime, alertInterval]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(totalTime * 60);
    setNotification(null);
    
    // 오디오 재생 중지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 진행률 계산
  const progress = totalTime > 0 ? ((totalTime * 60 - timeLeft) / (totalTime * 60)) * 100 : 0;

  return (
    <div className={`container ${notification ? 'alert-active' : ''}`}>
      {notification && (
        <div className="notification-banner">
          🔔 {notification}
        </div>
      )}

      <header className="app-header">
        <h1>타이머</h1>
      </header>
      
      <main className="glass-card">
        <section className="timer-display">
          <div className="time-text">{formatTime(timeLeft)}</div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
        </section>

        <section className="controls-area">
          <div className="settings-group">
            <div className="input-group">
              <label>시험 종목</label>
              <select 
                value={selectedPreset} 
                onChange={handlePresetChange}
                disabled={isRunning}
              >
                {PRESETS.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>시험 시간</label>
              <div className="input-wrapper">
                <input 
                  type="number" 
                  value={totalTime} 
                  onChange={(e) => setTotalTime(Number(e.target.value))} 
                  disabled={isRunning || selectedPreset !== '직접 입력'}
                  min="1"
                />
                <span>분</span>
              </div>
            </div>
            
            <div className="input-group">
              <label>알림 간격</label>
              <select 
                value={alertInterval} 
                onChange={(e) => setAlertInterval(Number(e.target.value))}
                disabled={isRunning}
              >
                {[5, 10, 15, 20, 25, 30].map(min => (
                  <option key={min} value={min}>{min}분 마다</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>소리 알림</label>
              <div className="toggle-wrapper">
                <input 
                  type="checkbox" 
                  id="sound-toggle"
                  checked={isSoundEnabled}
                  onChange={(e) => setIsSoundEnabled(e.target.checked)}
                />
                <label htmlFor="sound-toggle" className="toggle-label">
                  {isSoundEnabled ? '켜짐' : '꺼짐'}
                </label>
              </div>
            </div>
          </div>

          <div className="button-group">
            <button 
              className={`btn-primary ${isRunning ? 'pause' : 'start'}`}
              onClick={handleStartPause}
            >
              {isRunning ? '일시정지' : '시작'}
            </button>
            <button className="btn-secondary" onClick={handleReset}>
              초기화
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App