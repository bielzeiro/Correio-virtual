```react
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs 
} from 'firebase/firestore';
import { 
  Heart, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Share2, 
  Download, 
  Languages, 
  Wand2, 
  Play, 
  Pause, 
  FileText, 
  Layers, 
  Music, 
  Check, 
  Copy, 
  Eye, 
  ChevronRight, 
  ChevronLeft, 
  Settings, 
  Lock, 
  User, 
  Send,
  Loader2,
  Trash2,
  RefreshCw,
  Plus
} from 'lucide-react';

// ==========================================
// CONFIGURAÇÃO DO FIREBASE (FORNECIDO PELO AMBIENTE)
// ==========================================
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'correio-elegante-default';

// Chave da API Gemini (Será injetada em tempo de execução)
const apiKey = "";

// ==========================================
// LISTA DE TEMAS E ESTILOS VISUAIS
// ==========================================
const THEMES = [
  {
    id: 'romantic',
    name: 'Amor Eterno',
    bgClass: 'bg-gradient-to-tr from-rose-500 via-pink-600 to-red-400',
    cardStyle: 'bg-white/95 text-rose-900 border-pink-200 shadow-rose-500/30',
    particleColor: '#ff4d6d',
    font: 'font-serif',
    accentColor: 'text-rose-600',
    btnColor: 'bg-rose-500 hover:bg-rose-600 text-white'
  },
  {
    id: 'friendship',
    name: 'Amizade Radiante',
    bgClass: 'bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-400',
    cardStyle: 'bg-amber-50/95 text-amber-950 border-amber-200 shadow-orange-500/20',
    particleColor: '#f77f00',
    font: 'font-sans',
    accentColor: 'text-amber-700',
    btnColor: 'bg-amber-500 hover:bg-amber-600 text-white'
  },
  {
    id: 'galaxy',
    name: 'Espaço Sideral (Anônimo)',
    bgClass: 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-900',
    cardStyle: 'bg-slate-900/90 text-purple-200 border-purple-800 shadow-indigo-500/40 backdrop-blur-md',
    particleColor: '#a78bfa',
    font: 'font-mono',
    accentColor: 'text-purple-400',
    btnColor: 'bg-purple-600 hover:bg-purple-700 text-white'
  },
  {
    id: 'retro',
    name: 'Carta Vintage',
    bgClass: 'bg-gradient-to-tr from-amber-100 via-stone-200 to-orange-100',
    cardStyle: 'bg-amber-50/98 text-stone-800 border-stone-400 border-double border-4 shadow-stone-800/10',
    particleColor: '#854d0e',
    font: 'font-serif',
    accentColor: 'text-amber-800',
    btnColor: 'bg-amber-800 hover:bg-amber-900 text-white'
  },
  {
    id: 'neon',
    name: 'Neon Vibes',
    bgClass: 'bg-gradient-to-tr from-emerald-950 via-cyan-950 to-emerald-900',
    cardStyle: 'bg-neutral-900/90 text-cyan-400 border-cyan-500 shadow-cyan-500/30 border-2',
    particleColor: '#06b6d4',
    font: 'font-mono',
    accentColor: 'text-emerald-400',
    btnColor: 'bg-cyan-500 hover:bg-cyan-600 text-black font-bold'
  }
];

const FONTS = [
  { id: 'font-serif', name: 'Serif Clássico' },
  { id: 'font-sans', name: 'Sans Moderno' },
  { id: 'font-mono', name: 'Mono Tech' }
];

const TRANSITIONS = [
  { id: 'fade', name: 'Desvanecer (Fade)' },
  { id: 'slide', name: 'Deslizar (Slide)' },
  { id: 'zoom', name: 'Zoom Suave' }
];

export default function App() {
  // --- ESTADOS DO USUÁRIO ---
  const [user, setUser] = useState(null);
  const [userLetters, setUserLetters] = useState([]);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- ESTADOS DA CARTA ATUAL ---
  const [senderName, setSenderName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [selectedFont, setSelectedFont] = useState('font-serif');
  const [selectedTransition, setSelectedTransition] = useState('fade');
  const [displayMode, setDisplayMode] = useState('traditional'); // traditional, slides, gradual
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isPlayingSynth, setIsPlayingSynth] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentLetterId, setCurrentLetterId] = useState('');

  // --- ESTADOS DE APRESENTAÇÃO DO DESTINATÁRIO ---
  const [isRecipientView, setIsRecipientView] = useState(false);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [revealedChars, setRevealedChars] = useState(0);

  // --- ESTADOS DOS ASSISTENTES DE IA ---
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('romantico');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('en');

  // --- ESTADOS DA SÍNTESE DE VOZ (TTS) ---
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [ttsVoice, setTtsVoice] = useState('Leda'); // Voz padrão estilosa
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef(null);

  // --- AUXILIARES GERAIS ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [copySuccess, setCopySuccess] = useState(false);
  const canvasRef = useRef(null);
  const synthAudioCtxRef = useRef(null);
  const synthNodesRef = useRef([]);

  // ==========================================
  // INICIALIZAÇÃO DA AUTENTICAÇÃO (REGRA 3)
  // ==========================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Erro na autenticação:", err);
      } finally {
        setLoadingAuth(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return () => unsubscribe();
  }, []);

  // Carrega as cartas salvas do usuário logado (Se autenticado)
  useEffect(() => {
    if (!user) return;
    fetchUserLetters();
  }, [user]);

  // Detector de rota por Hash (Para abrir o link de compartilhamento diretamente)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/letter/')) {
        const id = hash.replace('#/letter/', '');
        loadLetterFromDb(id);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Executa no load inicial
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ==========================================
  // EFEITO VISUAL: PARTÍCULAS NO BACKGROUND (CANVAS)
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Cria as partículas
    let particles = [];
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height + canvas.height,
        size: Math.random() * 8 + 4,
        speedY: -(Math.random() * 1.5 + 0.5),
        speedX: Math.random() * 1 - 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        wobble: Math.random() * 100,
        wobbleSpeed: Math.random() * 0.02 + 0.01
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.wobble) * 0.5;
        p.wobble += p.wobbleSpeed;

        // Se sair do topo, reseta para a base
        if (p.y < -20) {
          p.y = canvas.height + 20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = selectedTheme.particleColor;

        // Desenha coração ou círculo dependendo do tema
        if (selectedTheme.id === 'romantic') {
          // Formato clássico de coração no canvas
          ctx.beginPath();
          const d = p.size;
          ctx.moveTo(p.x, p.y + d / 4);
          ctx.quadraticCurveTo(p.x, p.y, p.x + d / 2, p.y);
          ctx.quadraticCurveTo(p.x + d, p.y, p.x + d, p.y + d / 3);
          ctx.quadraticCurveTo(p.x + d, p.y + d * (2/3), p.x + d / 2, p.y + d);
          ctx.quadraticCurveTo(p.x, p.y + d * (2/3), p.x, p.y + d / 3);
          ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + d / 4);
          ctx.closePath();
          ctx.fill();
        } else if (selectedTheme.id === 'galaxy') {
          // Estrelinhas cintilantes de 4 pontas
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x + p.size/3, p.y - p.size/3);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.lineTo(p.x + p.size/3, p.y + p.size/3);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.lineTo(p.x - p.size/3, p.y + p.size/3);
          ctx.lineTo(p.x - p.size, p.y);
          ctx.lineTo(p.x - p.size/3, p.y - p.size/3);
          ctx.closePath();
          ctx.fill();
        } else {
          // Círculos suaves ou bolhas
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [selectedTheme]);

  // Efeito para revelação gradual das letras (displayMode: gradual)
  useEffect(() => {
    if (displayMode === 'gradual' && envelopeOpened) {
      setRevealedChars(0);
      const interval = setInterval(() => {
        setRevealedChars((prev) => {
          if (prev >= letterContent.length) {
            clearInterval(interval);
            return letterContent.length;
          }
          return prev + 2; // Revela de 2 em 2 caracteres para suavidade
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [displayMode, envelopeOpened, letterContent]);

  // ==========================================
  // SINTETIZADOR DE ÁUDIO WEB AUDIO API (MÚSICA DE FUNDO GARANTIDA)
  // ==========================================
  const toggleAmbientMusic = () => {
    if (isPlayingSynth) {
      // Para o synth
      if (synthAudioCtxRef.current) {
        synthAudioCtxRef.current.close();
        synthAudioCtxRef.current = null;
      }
      setIsPlayingSynth(false);
      showToast('Música de fundo pausada.', 'info');
    } else {
      // Inicia o Web Audio API synth
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        synthAudioCtxRef.current = ctx;

        // Frequências para acordes lindos e flutuantes (Cmaj9, Am9, Fmaj7)
        const progression = [
          [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
          [110.00, 130.81, 164.81, 220.00, 261.63], // Am9
          [87.31, 130.81, 174.61, 220.00, 261.63],  // Fmaj7
          [98.00, 146.83, 196.00, 246.94, 293.66]   // G6
        ];

        let currentChordIndex = 0;

        const playChord = () => {
          if (!synthAudioCtxRef.current) return;
          const now = synthAudioCtxRef.current.currentTime;
          const chord = progression[currentChordIndex];

          // Cria osciladores suaves (Onda senoidal para pureza e suavidade)
          chord.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            // Filtro lowpass para deixar o som macio e espacial
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, now);

            // Envelope de volume ultra lento para efeito Pad flutuante
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.04 / chord.length, now + 3); // Slow attack
            gain.gain.setValueAtTime(0.04 / chord.length, now + 7);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 12); // Slow decay

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 12.5);
          });

          // Prepara o próximo acorde a cada 10 segundos
          currentChordIndex = (currentChordIndex + 1) % progression.length;
          synthNodesRef.current.push(setTimeout(playChord, 10000));
        };

        playChord();
        setIsPlayingSynth(true);
        showToast('Música ambiente gerada via Sintetizador Web!', 'success');
      } catch (err) {
        console.error("Falha ao inicializar Web Audio API:", err);
        showToast('Seu navegador bloqueou o áudio. Toque de novo!', 'error');
      }
    }
  };

  // Limpa timers do sintetizador ao desmontar
  useEffect(() => {
    return () => {
      synthNodesRef.current.forEach(timer => clearTimeout(timer));
      if (synthAudioCtxRef.current) {
        synthAudioCtxRef.current.close();
      }
    };
  }, []);

  // ==========================================
  // OPERAÇÕES DO BANCO DE DADOS FIRESTORE (REGRAS 1, 2, 3)
  // ==========================================
  const fetchUserLetters = async () => {
    if (!user) return;
    try {
      // Regra 1: Caminho estrito privado
      const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'saved_letters');
      const snap = await getDocs(colRef);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserLetters(list);
    } catch (err) {
      console.error("Erro ao listar cartas salvas:", err);
    }
  };

  const saveLetter = async () => {
    if (!user) {
      showToast('Autenticando primeiro...', 'info');
      return;
    }
    if (!letterContent.trim()) {
      showToast('Por favor, escreva o conteúdo da carta.', 'error');
      return;
    }

    try {
      const data = {
        senderName,
        receiverName,
        letterContent,
        themeId: selectedTheme.id,
        font: selectedFont,
        transition: selectedTransition,
        displayMode,
        customImageUrl,
        createdAt: new Date().toISOString()
      };

      // Regra 1: Salva no caminho público para compartilhamento direto e no privado do usuário
      const publicDocRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'letters'), data);
      
      const privateDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'saved_letters', publicDocRef.id);
      await setDoc(privateDocRef, data);

      setCurrentLetterId(publicDocRef.id);
      setIsSaved(true);
      fetchUserLetters();
      showToast('Carta salva e link de compartilhamento gerado com sucesso!', 'success');
    } catch (err) {
      console.error("Erro ao salvar carta:", err);
      showToast('Erro ao salvar no banco de dados.', 'error');
    }
  };

  const loadLetterFromDb = async (id) => {
    try {
      // Regra 1: Busca pelo caminho público
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'letters', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSenderName(data.senderName || '');
        setReceiverName(data.receiverName || '');
        setLetterContent(data.letterContent || '');
        const theme = THEMES.find(t => t.id === data.themeId) || THEMES[0];
        setSelectedTheme(theme);
        setSelectedFont(data.font || 'font-serif');
        setSelectedTransition(data.transition || 'fade');
        setDisplayMode(data.displayMode || 'traditional');
        setCustomImageUrl(data.customImageUrl || '');
        
        setIsRecipientView(true); // Abre direto na tela de recebimento
        setEnvelopeOpened(false); // Reseta a abertura
        showToast('Carta carregada com sucesso!', 'success');
      } else {
        showToast('Carta não encontrada no servidor.', 'error');
      }
    } catch (err) {
      console.error("Erro ao carregar carta:", err);
      showToast('Erro ao baixar os dados da carta.', 'error');
    }
  };

  // ==========================================
  // CHAMADAS DE INTELIGÊNCIA ARTIFICIAL (GEMINI API)
  // ==========================================
  
  // Requisição com backoff exponencial contra limitação de taxa
  const fetchWithBackoff = async (url, payload, retries = 5, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) return await response.json();
      } catch (err) {
        if (i === retries - 1) throw err;
      }
      await new Promise(res => setTimeout(res, delay));
      delay *= 2; // Exp backoff
    }
    throw new Error('Falha após múltiplas tentativas.');
  };

  // Assistente de Escrita AI
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      showToast('Descreva o que você gostaria de colocar na carta.', 'error');
      return;
    }
    setIsGeneratingAI(true);
    const systemPrompt = `Você é um escritor poético e empático de Correio Elegante. Escreva uma carta baseando-se no tom escolhido pelo usuário (${aiTone}). Mantenha um texto bonito, refinado, mas de tamanho personalizável. IMPORTANTE: Escreva apenas a carta de forma fluida, sem introduções ou explicações.`;
    const userQuery = `Escreva uma carta de correio elegante sobre: "${aiPrompt}". O remetente se chama "${senderName}" e o destinatário "${receiverName}".`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      };

      const result = await fetchWithBackoff(url, payload);
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setLetterContent(text);
        showToast('Carta inspiradora criada pela IA!', 'success');
      } else {
        showToast('Resposta inválida do assistente de escrita.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha na IA de escrita. Verifique a conexão.', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Tradutor Inteligente
  const handleTranslateAI = async () => {
    if (!letterContent.trim()) {
      showToast('Escreva algo primeiro para poder traduzir.', 'error');
      return;
    }
    setIsTranslating(true);
    const systemPrompt = `Você é um tradutor literário brilhante. Traduza a carta fornecida para o seguinte idioma de destino: "${targetLang}". Mantenha toda a nuance poética, paixão e estética do texto original intactos.`;
    
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: letterContent }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      };

      const result = await fetchWithBackoff(url, payload);
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setLetterContent(text);
        showToast('Carta traduzida preservando o tom!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao traduzir.', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  // ==========================================
  // SÍNTESE DE VOZ GEMINI TTS (NARRADOR DE ACESSIBILIDADE)
  // ==========================================
  const speakLetterAI = async () => {
    if (!letterContent.trim()) {
      showToast('Nenhum texto para narrar.', 'error');
      return;
    }

    if (audioUrl) {
      // Se já existe áudio gerado, apenas gerencia play/pause
      if (isSpeaking) {
        audioRef.current.pause();
        setIsSpeaking(false);
      } else {
        audioRef.current.play();
        setIsSpeaking(true);
      }
      return;
    }

    setLoadingAudio(true);
    showToast('Gerando narração ultra realista via IA...', 'info');

    try {
      // Prompt com instrução de tom de leitura e voz premium
      const textToSpeak = `Leia com voz calorosa, tranquila e profunda, fazendo pausas dramáticas: ${letterContent}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ parts: [{ text: textToSpeak }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: ttsVoice // Voices: Zephyr, Puck, Leda, Kore, etc.
              }
            }
          }
        },
        model: "gemini-2.5-flash-preview-tts"
      };

      const result = await fetchWithBackoff(url, payload);
      const inlineData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      
      if (inlineData && inlineData.data) {
        // Conversão de PCM-16 (audio/L16) para WAV (Exigência do Guia de Integração Gemini)
        const pcmBase64 = inlineData.data;
        // Geralmente as amostras de voz do Gemini TTS são de 24000Hz ou 16000Hz.
        const wavBlobUrl = pcmToWav(pcmBase64, 24000);
        
        setAudioUrl(wavBlobUrl);
        setIsSpeaking(true);
        showToast('Áudio gerado!', 'success');

        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio play blocked", e));
          }
        }, 150);
      } else {
        showToast('A IA de voz não retornou dados de áudio.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha ao acionar sintetizador de voz do Gemini.', 'error');
    } finally {
      setLoadingAudio(false);
    }
  };

  // Utilitário de codificação de áudio PCM16 para WAV
  const pcmToWav = (pcmBase64, sampleRate = 24000) => {
    const binaryString = atob(pcmBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const buffer = bytes.buffer;
    
    // Cria cabeçalho WAV de 44 Bytes
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + len, true);   // tamanho total
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);        // tamanho do chunk de formato
    view.setUint16(20, 1, true);         // formato PCM linear
    view.setUint16(22, 1, true);         // mono
    view.setUint32(24, sampleRate, true); // taxa de amostragem
    view.setUint32(28, sampleRate * 2, true); // taxa de bytes (SampleRate * Canais * BitsPerSample/8)
    view.setUint16(32, 2, true);         // bloco de alinhamento
    view.setUint16(34, 16, true);        // 16 bits
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, len, true);       // tamanho do payload de áudio

    const blob = new Blob([wavHeader, buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  };

  // ==========================================
  // FERRAMENTAS DE EXPORTAÇÃO E DOWNLOAD
  // ==========================================
  const downloadInteractiveCard = () => {
    if (!letterContent) {
      showToast('Nenhum conteúdo para salvar.', 'error');
      return;
    }

    // Cria um HTML interativo contendo a carta estilizada para abrir offline!
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Correio Elegante de ${senderName || 'Anônimo'}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      </style>
    </head>
    <body class="${selectedTheme.bgClass} flex items-center justify-center min-h-screen p-4 overflow-hidden">
      <div class="max-w-xl w-full ${selectedTheme.cardStyle} p-8 rounded-2xl border shadow-2xl relative">
        <div class="absolute -top-6 -left-6 text-4xl">💌</div>
        <div class="absolute -bottom-6 -right-6 text-4xl">✨</div>
        
        <h2 class="text-xs uppercase tracking-wider text-center font-sans opacity-70 mb-4">Correio Elegante Especial</h2>
        
        <div class="${selectedFont} space-y-6">
          <div class="border-b pb-2 flex justify-between">
            <span class="font-bold">Para: <span class="underline">${receiverName || 'Alguém Especial'}</span></span>
            <span class="font-bold text-xs opacity-60">De: ${senderName || 'Um Admirador Secreto'}</span>
          </div>
          
          ${customImageUrl ? `<img src="${customImageUrl}" class="w-full h-48 object-cover rounded-xl my-4" />` : ''}

          <p class="whitespace-pre-line text-lg leading-relaxed text-center">
            ${letterContent}
          </p>
          
          <div class="text-center pt-4 border-t text-sm italic opacity-80">
            Com carinho e elegância. ❤️
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = `Correio_Elegante_${receiverName || 'Especial'}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Carta salva offline como cartão interativo!', 'success');
  };

  // ==========================================
  // FUNÇÕES DE UTILIDADE E AUXILIARES
  // ==========================================
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4500);
  };

  const copyShareLink = () => {
    if (!currentLetterId) {
      showToast('Salve a carta no servidor para habilitar o link!', 'error');
      return;
    }
    const link = `${window.location.origin}${window.location.pathname}#/letter/${currentLetterId}`;
    
    // Método compatível com iframes do Canvas
    const dummy = document.createElement('input');
    document.body.appendChild(dummy);
    dummy.value = link;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);

    setCopySuccess(true);
    showToast('Link de compartilhamento copiado!', 'success');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Separa o texto da carta em slides baseado nos parágrafos
  const getSlides = () => {
    return letterContent.split('\n\n').filter(p => p.trim() !== '');
  };

  return (
    <div className="relative min-h-screen font-sans antialiased text-slate-800 flex flex-col justify-between overflow-x-hidden">
      
      {/* Canvas interativo para animação de fundo adaptativa */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Gradiente do Tema Dinâmico */}
      <div className={`fixed inset-0 -z-10 transition-all duration-1000 ${selectedTheme.bgClass}`} />

      {/* ==========================================
          TOAST ALERT PERSONALIZADO
          ========================================== */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg bg-slate-900 text-white text-sm font-medium animate-bounce border border-slate-700">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ==========================================
          BARRA DE TOPO (Navegação / Status de Login)
          ========================================== */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between bg-white/10 backdrop-blur-md border-b border-white/10 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Heart className="w-6 h-6 fill-rose-500 text-rose-500 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wider">L&B Correio Elegante</h1>
            <p className="text-xs opacity-75">Crie mensagens que encantam corações</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPlayingSynth ? (
            <button 
              onClick={toggleAmbientMusic}
              className="bg-white/20 hover:bg-white/30 p-2.5 rounded-full text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title="Pausar Música Ambiente"
            >
              <Volume2 className="w-4 h-4 animate-bounce" />
              <span>Sintetizador ON</span>
            </button>
          ) : (
            <button 
              onClick={toggleAmbientMusic}
              className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full text-white transition flex items-center gap-1.5 text-xs"
              title="Ativar Música Ambiente"
            >
              <VolumeX className="w-4 h-4" />
              <span>Sem Áudio</span>
            </button>
          )}

          {isRecipientView && (
            <button 
              onClick={() => {
                setIsRecipientView(false);
                setAudioUrl(null);
                if (audioRef.current) audioRef.current.pause();
                setIsSpeaking(false);
              }}
              className="bg-white/20 hover:bg-white/30 text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1 transition"
            >
              <Settings className="w-3.5 h-3.5" /> Voltar ao Editor
            </button>
          )}
        </div>
      </header>

      {/* ==========================================
          VISTA DO RECEPTOR (CARTA ENVIADA / RECEBIDA)
          ========================================== */}
      {isRecipientView ? (
        <main className="relative z-10 flex-grow flex items-center justify-center p-4">
          {!envelopeOpened ? (
            /* ENVELOPE FECHADO INTERATIVO */
            <div 
              onClick={() => {
                setEnvelopeOpened(true);
                showToast('Carregando carta...', 'success');
              }}
              className="group cursor-pointer relative max-w-lg w-full aspect-[4/3] bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-2xl p-6 border-4 border-amber-200 flex flex-col justify-between items-center transition-transform hover:scale-105 duration-300"
            >
              <div className="absolute top-0 inset-x-0 h-1/2 bg-amber-200/50 rounded-b-[100px] shadow-inner flex justify-center items-start pt-4">
                <div className="bg-rose-500 p-3 rounded-full text-white shadow-lg animate-pulse group-hover:scale-110 transition">
                  <Heart className="w-8 h-8 fill-white text-white" />
                </div>
              </div>

              <div className="mt-28 text-center">
                <span className="text-xs uppercase tracking-widest text-amber-800 font-semibold">Mensagem Especial Recebida</span>
                <h3 className="text-2xl font-serif mt-2 text-stone-800">
                  Para: <span className="font-extrabold underline">{receiverName || 'Alguém Especial'}</span>
                </h3>
              </div>

              <div className="text-center text-xs text-amber-700/80 font-medium flex items-center gap-1 animate-bounce">
                Clique aqui para abrir o envelope <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ) : (
            /* CONTEÚDO DA CARTA EXIBIDA */
            <div className={`max-w-2xl w-full ${selectedTheme.cardStyle} p-6 md:p-10 rounded-3xl border shadow-2xl transition-all duration-700 relative`}>
              
              {/* Opções Flutuantes do Card de Leitura */}
              <div className="absolute -top-12 right-0 flex gap-2">
                <button 
                  onClick={speakLetterAI}
                  disabled={loadingAudio}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {loadingAudio ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isSpeaking ? (
                    <Pause className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {isSpeaking ? 'Pausar Narrador' : 'Narração AI'}
                </button>

                <button 
                  onClick={downloadInteractiveCard}
                  className="bg-white text-slate-800 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg hover:bg-slate-50 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Carta
                </button>
              </div>

              {/* Elementos Secretos de Design de acordo com o Tema */}
              {selectedTheme.id === 'romantic' && (
                <div className="absolute top-4 right-4 text-rose-300 opacity-60 text-5xl font-serif">♥</div>
              )}
              {selectedTheme.id === 'galaxy' && (
                <div className="absolute top-4 right-4 text-indigo-400 opacity-40 text-4xl">✦</div>
              )}

              {/* IDENTIFICAÇÃO DOS NAMORADOS / AMIGOS */}
              <div className="border-b border-current/20 pb-4 mb-6 flex flex-col sm:flex-row sm:justify-between items-center gap-2">
                <div>
                  <span className="text-xs uppercase opacity-70 tracking-wider">Para</span>
                  <h4 className="text-xl font-bold">{receiverName || 'Alguém Especial'}</h4>
                </div>
                {senderName && (
                  <div className="text-center sm:text-right">
                    <span className="text-xs opacity-70 uppercase tracking-wider">De</span>
                    <h4 className="text-lg font-semibold italic">{senderName}</h4>
                  </div>
                )}
              </div>

              {/* IMAGEM CUSTOMIZADA SE HOUVER */}
              {customImageUrl && (
                <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border border-white/20">
                  <img src={customImageUrl} alt="Imagem Especial" className="w-full max-h-64 object-cover" />
                </div>
              )}

              {/* ==========================
                  MODO DE EXIBIÇÃO: TRADICIONAL
                  ========================== */}
              {displayMode === 'traditional' && (
                <div className={`${selectedFont} text-lg md:text-xl leading-relaxed whitespace-pre-line text-center py-4`}>
                  {letterContent || 'Nenhuma mensagem escrita ainda...'}
                </div>
              )}

              {/* ==========================
                  MODO DE EXIBIÇÃO: SLIDES MÁGICOS
                  ========================== */}
              {displayMode === 'slides' && (
                <div className="min-h-[250px] flex flex-col justify-between py-4">
                  <div className={`transition-all duration-500 text-center ${selectedFont} text-lg md:text-xl leading-relaxed`}>
                    {getSlides()[currentSlide] || 'Nenhum slide disponível.'}
                  </div>
                  
                  {/* Navegação de Slides */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-current/10">
                    <button
                      disabled={currentSlide === 0}
                      onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                      className="p-2 rounded-xl bg-current/5 hover:bg-current/10 disabled:opacity-30 transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-semibold">
                      Slide {currentSlide + 1} de {getSlides().length}
                    </span>
                    <button
                      disabled={currentSlide >= getSlides().length - 1}
                      onClick={() => setCurrentSlide(prev => Math.min(getSlides().length - 1, prev + 1))}
                      className="p-2 rounded-xl bg-current/5 hover:bg-current/10 disabled:opacity-30 transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ==========================
                  MODO DE EXIBIÇÃO: REVELAÇÃO GRADUAL
                  ========================== */}
              {displayMode === 'gradual' && (
                <div className="min-h-[200px] flex flex-col justify-between py-4">
                  <div className={`${selectedFont} text-lg md:text-xl leading-relaxed whitespace-pre-line text-center`}>
                    {letterContent.substring(0, revealedChars)}
                    {revealedChars < letterContent.length && (
                      <span className="inline-block w-2.5 h-5 bg-rose-500 ml-1 animate-pulse" />
                    )}
                  </div>
                  {revealedChars < letterContent.length && (
                    <div className="text-center text-xs opacity-60 mt-4">
                      Digitando carta de sentimentos...
                    </div>
                  )}
                </div>
              )}

              {/* Assinatura de Encerramento */}
              <div className="mt-8 pt-4 border-t border-current/15 text-center text-xs opacity-75 font-mono">
                Criado com amor usando Correio Elegante L&B
              </div>
            </div>
          )}
        </main>
      ) : (
        /* ==========================================
            ÁREA DO EDITOR (REMETENTE / CRIADOR)
            ========================================== */
        <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PAINEL DE EDIÇÃO E FORMULÁRIO (ESQUERDA) */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-slate-100 flex flex-col gap-6">
            
            {/* Cabeçalho do Editor */}
            <div className="border-b pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Escreva sua Mensagem</h3>
                <p className="text-xs text-slate-500">Customize cada detalhe da sua declaração</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRecipientView(true)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" /> Visualizar
                </button>
              </div>
            </div>

            {/* SEÇÃO 1: NOMES DO DESTINATÁRIO E REMETENTE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Para (Destinatário):</label>
                <input 
                  type="text" 
                  value={receiverName} 
                  onChange={(e) => setReceiverName(e.target.value)} 
                  placeholder="Nome de quem vai receber"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">De (Seu Nome/Anônimo):</label>
                <input 
                  type="text" 
                  value={senderName} 
                  onChange={(e) => setSenderName(e.target.value)} 
                  placeholder="Deixe em branco para Anônimo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                />
              </div>
            </div>

            {/* SEÇÃO 2: ASSISTENTE DE ESCRITA INTELIGENTE (GEMINI IA) */}
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2 text-indigo-900 font-bold text-sm">
                <Wand2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span>Escritor Assistente IA</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8">
                  <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: Carta romântica para noivado, agradecendo apoio..."
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="md:col-span-4 flex gap-2">
                  <select 
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="bg-white border border-indigo-200 rounded-xl px-2 py-2 text-xs text-slate-700"
                  >
                    <option value="romantico">💘 Romântico</option>
                    <option value="amizade">🌟 Amigo/Leal</option>
                    <option value="divertido">🤪 Engraçado</option>
                    <option value="misterioso">🕵️ Anônimo</option>
                  </select>
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition disabled:opacity-50"
                  >
                    {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gerar'}
                  </button>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: ÁREA DO TEXTO (LIVRE DE LIMITES) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase text-slate-500">Mensagem do Correio Elegante:</label>
                <div className="flex items-center gap-1.5">
                  {/* TRADUTOR RÁPIDO DE IA */}
                  <select 
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-600 focus:outline-none"
                  >
                    <option value="en">🇺🇸 Inglês</option>
                    <option value="es">🇪🇸 Espanhol</option>
                    <option value="fr">🇫🇷 Francês</option>
                    <option value="it">🇮🇹 Italiano</option>
                    <option value="ja">🇯🇵 Japonês</option>
                  </select>
                  <button 
                    onClick={handleTranslateAI}
                    disabled={isTranslating}
                    className="bg-slate-800 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-slate-900 transition disabled:opacity-50"
                    title="Traduzir Mensagem Atual"
                  >
                    {isTranslating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Languages className="w-2.5 h-2.5" />}
                    Traduzir
                  </button>
                </div>
              </div>
              <textarea 
                value={letterContent}
                onChange={(e) => {
                  setLetterContent(e.target.value);
                  setIsSaved(false);
                  setAudioUrl(null); // Reseta áudio gerado se alterar texto
                }}
                rows={7}
                placeholder="Abra seu coração... Digite sua declaração sem limites de espaço ou caracteres."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition leading-relaxed font-serif"
              />
            </div>

            {/* SEÇÃO 4: CONFIGURAÇÃO DE IMAGEM EXTERNA */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Imagem, GIF ou Foto Especial (Link URL):</label>
              <input 
                type="text" 
                value={customImageUrl} 
                onChange={(e) => setCustomImageUrl(e.target.value)} 
                placeholder="Insira um link https de imagem, gif ou foto para decorar"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
              />
            </div>

            {/* CONFIGURAÇÃO EXTRA DO NARRADOR AI DE ACESSIBILIDADE */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-rose-500" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Escolha a Voz do Narrador AI</h4>
                  <p className="text-[10px] text-slate-500">Utiliza inteligência artificial realista</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <select 
                  value={ttsVoice}
                  onChange={(e) => {
                    setTtsVoice(e.target.value);
                    setAudioUrl(null); // Reseta cache
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none flex-grow sm:flex-grow-0"
                >
                  <option value="Leda">Voz Leda (Suave/Elegante)</option>
                  <option value="Zephyr">Voz Zephyr (Entusiasta)</option>
                  <option value="Puck">Voz Puck (Brincalhão)</option>
                  <option value="Kore">Voz Kore (Profunda/Poética)</option>
                </select>
              </div>
            </div>

            {/* SALVAR E COMPARTILHAR */}
            <div className="border-t pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={saveLetter}
                className="flex-grow bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-rose-500/20"
              >
                <Check className="w-5 h-5" /> Salvar Carta Online
              </button>

              {isSaved && (
                <button
                  onClick={copyShareLink}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  {copySuccess ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
                  {copySuccess ? 'Copiado!' : 'Copiar Link Especial'}
                </button>
              )}
            </div>

          </div>

          {/* PAINEL DE COSTUMIZAÇÃO DE VISUAIS (DIREITA) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* COSTUMIZAÇÃO DO TEMA */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-rose-500" /> Tema e Paleta de Cores
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setSelectedTheme(theme);
                      showToast(`Tema alterado para: ${theme.name}`, 'info');
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      selectedTheme.id === theme.id 
                        ? 'border-rose-500 ring-2 ring-rose-300' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{theme.name}</h4>
                      <p className="text-[10px] text-slate-500">Cores adaptáveis personalizadas</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full ${theme.bgClass} border border-white shadow-inner`} />
                  </button>
                ))}
              </div>
            </div>

            {/* TIPOGRAFIA, FORMATOS E TRANSIÇÕES */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-slate-100 space-y-5">
              
              {/* Escolha da Fonte */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tipografia (Fonte):</label>
                <div className="grid grid-cols-3 gap-2">
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFont(f.id)}
                      className={`py-2 px-3 text-xs rounded-xl border text-center font-semibold transition ${
                        selectedFont === f.id 
                          ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' 
                          : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formato de Apresentação */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Formato de Página/Exibição:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDisplayMode('traditional')}
                    className={`py-2 px-1 text-[11px] rounded-xl border text-center font-semibold transition ${
                      displayMode === 'traditional' 
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' 
                        : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📃 Tradicional
                  </button>
                  <button
                    onClick={() => setDisplayMode('slides')}
                    className={`py-2 px-1 text-[11px] rounded-xl border text-center font-semibold transition ${
                      displayMode === 'slides' 
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' 
                        : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🎴 Em Slides
                  </button>
                  <button
                    onClick={() => setDisplayMode('gradual')}
                    className={`py-2 px-1 text-[11px] rounded-xl border text-center font-semibold transition ${
                      displayMode === 'gradual' 
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' 
                        : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ✍️ Revelação
                  </button>
                </div>
              </div>

              {/* Transições (Apenas aplicável ao modo Slide) */}
              {displayMode === 'slides' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Efeito de Passar de Slide:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TRANSITIONS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTransition(t.id)}
                        className={`py-2 px-2 text-[10px] rounded-xl border text-center font-semibold transition ${
                          selectedTransition === t.id 
                            ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' 
                            : 'border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* MEU BANCO DE CARTAS SALVAS (HISTÓRICO) */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-500" /> Meu Histórico de Cartas
              </h3>
              {userLetters.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Suas cartas salvas aparecerão aqui.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {userLetters.map((l) => (
                    <div 
                      key={l.id} 
                      className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100 hover:border-slate-200 transition"
                    >
                      <div className="truncate pr-2">
                        <h4 className="text-xs font-bold text-slate-700 truncate">Para: {l.receiverName || 'Especial'}</h4>
                        <p className="text-[10px] text-slate-400">Criado em: {new Date(l.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => loadLetterFromDb(l.id)}
                          className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg text-xs"
                          title="Ver Carta"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </main>
      )}

      {/* Áudio invisível para reprodução do TTS */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={() => setIsSpeaking(false)} 
          className="hidden" 
        />
      )}

      {/* ==========================================
          RODAPÉ DO WEBSITE
          ========================================== */}
      <footer className="relative z-10 py-6 text-center text-xs text-white/70 bg-black/15 border-t border-white/5 mt-8 backdrop-blur-sm">
        <p>© 2026 Love&Bond Correio Elegante - Desenvolvido para espalhar sentimentos e sorrisos.</p>
        <p className="opacity-50 mt-1">Conexão protegida com banco de dados em nuvem e APIs generativas do Gemini.</p>
      </footer>

    </div>
  );
}

```
