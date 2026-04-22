import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rss, 
  Github, 
  ExternalLink, 
  Calendar, 
  MessageCircle, 
  ChevronRight, 
  Share2,
  Coffee,
  Search,
  ArrowUpRight
} from 'lucide-react';

// --- 模拟数据层 (实际使用时可从 data.json 异步 fetch) ---
const NEWSLETTER_DATA = [
  {
    id: '2024-04-21',
    title: "AI 演进与极简主义设计的回归",
    date: "2024年4月21日",
    summary: "今日探讨了大语言模型在前端工程化中的深度集成，以及为什么我们开始重新审视无边框 UI 设计。",
    tags: ["Artificial Intelligence", "UI Design"],
    items: [
      {
        type: "link",
        title: "LLM-Native UI Patterns",
        description: "一份关于如何为 AI 原生应用设计交互界面的深度指南。",
        url: "https://example.com/ai-ui",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800"
      },
      {
        type: "thought",
        content: "过度设计是现代 Web 的通病。有时候，一个完美的排版比一堆动效更能打动人心。",
        author: "Editor's Note"
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800",
        caption: "未来的工作空间：极简与高效的结合。"
      }
    ]
  },
  {
    id: '2024-04-20',
    title: "React 19 的新特性与生态变革",
    date: "2024年4月20日",
    summary: "React 19 带来了许多令人激动的更新，尤其是 Server Components 的进一步优化。",
    tags: ["React", "Web Dev"],
    items: [
      {
        type: "link",
        title: "React 19 Beta Release",
        description: "官方发布的测试版本说明，涵盖了所有重大变更。",
        url: "https://react.dev",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800"
      }
    ]
  }
];

// --- 动画配置 ---
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

// --- 子组件: 简报条目 ---
const NewsItem = ({ item }) => {
  if (item.type === 'link') {
    return (
      <motion.a 
        variants={fadeIn}
        href={item.url}
        target="_blank"
        className="group relative block p-4 rounded-2xl bg-white/50 border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-xl hover:shadow-indigo-500/5 overflow-hidden"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {item.image && (
            <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
          )}
          <div className="flex-1">
            <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
              {item.title} <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
            </h4>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">{item.description}</p>
          </div>
        </div>
      </motion.a>
    );
  }

  if (item.type === 'thought') {
    return (
      <motion.div variants={fadeIn} className="p-6 rounded-2xl bg-indigo-50 border-l-4 border-indigo-500 italic text-indigo-900">
        <p className="text-lg">“{item.content}”</p>
        <span className="block mt-2 text-sm font-bold not-italic">— {item.author}</span>
      </motion.div>
    );
  }

  if (item.type === 'image') {
    return (
      <motion.div variants={fadeIn} className="space-y-2">
        <img src={item.url} alt="Gallery" className="w-full rounded-2xl shadow-lg" />
        {item.caption && <p className="text-center text-sm text-slate-400 font-medium">{item.caption}</p>}
      </motion.div>
    );
  }
  return null;
};

// --- 主应用 ---
export default function App() {
  const [selectedIssue, setSelectedIssue] = useState(NEWSLETTER_DATA[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-600">
      {/* 顶部导航 */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
              B
            </div>
            <h1 className="text-lg font-black tracking-tight hidden sm:block">BRIEF.LOG</h1>
          </motion.div>
          
          <div className="flex items-center gap-6">
            <a href="/rss.xml" className="text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium text-sm">
              <Rss size={18} /> <span className="hidden md:inline">RSS 订阅</span>
            </a>
            <a href="https://github.com/yourname/brief-log" className="text-slate-500 hover:text-indigo-600 transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* 左侧边栏: 历史存档 */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="sticky top-32">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">历史简讯</h3>
            <div className="space-y-3">
              {NEWSLETTER_DATA.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center justify-between group ${
                    selectedIssue.id === issue.id 
                    ? 'bg-white shadow-xl shadow-slate-200/50 scale-105 border border-indigo-100' 
                    : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-bold mb-1 ${selectedIssue.id === issue.id ? 'text-indigo-500' : 'text-slate-400'}`}>
                      {issue.date}
                    </p>
                    <p className="font-bold text-sm truncate max-w-[180px]">{issue.title}</p>
                  </div>
                  <ChevronRight size={16} className={`transition-transform ${selectedIssue.id === issue.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </button>
              ))}
            </div>

            <div className="mt-12 p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-200">
              <Coffee className="mb-4 opacity-80" size={24} />
              <h4 className="font-bold text-lg leading-tight">喜欢这份简报？</h4>
              <p className="text-indigo-100 text-sm mt-2 opacity-90">通过 GitHub 星标来支持我的更新。数据由 GitHub Actions 自动构建。</p>
              <button className="mt-6 w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                Support via GitHub
              </button>
            </div>
          </div>
        </aside>

        {/* 右侧主内容: 简报详情 */}
        <section className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIssue.id}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={staggerContainer}
              className="space-y-10"
            >
              {/* 文章头部 */}
              <header className="space-y-4">
                <motion.div variants={fadeIn} className="flex gap-2">
                  {selectedIssue.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      {tag}
                    </span>
                  ))}
                </motion.div>
                <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1]">
                  {selectedIssue.title}
                </motion.h2>
                <motion.p variants={fadeIn} className="text-xl text-slate-500 leading-relaxed font-light">
                  {selectedIssue.summary}
                </motion.p>
              </header>

              <hr className="border-slate-200" />

              {/* 内容流 */}
              <div className="space-y-8">
                {selectedIssue.items.map((item, idx) => (
                  <NewsItem key={idx} item={item} />
                ))}
              </div>

              {/* 评论区占位 (实际部署时嵌入 Giscus 代码) */}
              <motion.div variants={fadeIn} className="mt-20 pt-12 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-8">
                  <MessageCircle className="text-indigo-600" />
                  <h3 className="text-2xl font-bold">读者交流</h3>
                </div>
                <div className="aspect-video bg-slate-100 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 group cursor-pointer hover:bg-slate-50 transition-colors">
                  <p className="font-bold mb-2">此处集成 Giscus 评论系统</p>
                  <p className="text-sm">基于 GitHub Discussions，无需注册即可互动</p>
                  <div className="mt-4 flex gap-2">
                     <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">模拟加载 Giscus...</span>
                  </div>
                </div>
              </motion.div>

            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
          <p className="text-slate-400 text-sm font-medium">
            © 2024 Brief.Log · Generated by GitHub Actions · Hosted on GitHub Pages
          </p>
          <div className="flex justify-center gap-6">
             <a href="#" className="text-slate-300 hover:text-slate-600"><Share2 size={18} /></a>
             <a href="#" className="text-slate-300 hover:text-slate-600"><Github size={18} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}