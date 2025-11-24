import { Paper, PaperVersion } from '../types';

const STORAGE_KEY = 'scholargen_papers_v1';

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15);
};

export const getPapers = (): Paper[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load papers", e);
    return [];
  }
};

export const saveNewPaper = (topic: string, overview: string, content: string): Paper => {
  const papers = getPapers();
  const timestamp = Date.now();
  
  const newPaper: Paper = {
    id: generateId(),
    topic,
    overview,
    createdAt: timestamp,
    updatedAt: timestamp,
    versions: [{
      id: generateId(),
      versionNumber: 1,
      content,
      createdAt: timestamp
    }]
  };
  
  // Add to beginning of array
  papers.unshift(newPaper);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
  return newPaper;
};

export const savePaperVersion = (paperId: string, content: string): Paper | null => {
  const papers = getPapers();
  const index = papers.findIndex(p => p.id === paperId);
  
  if (index === -1) return null;

  const paper = papers[index];
  const nextVersionNum = paper.versions.length + 1;
  const timestamp = Date.now();

  const newVersion: PaperVersion = {
    id: generateId(),
    versionNumber: nextVersionNum,
    content,
    createdAt: timestamp
  };
  
  paper.versions.push(newVersion);
  paper.updatedAt = timestamp;
  
  // Move updated paper to top
  papers.splice(index, 1);
  papers.unshift(paper);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
  return paper;
};

export const getPaperById = (id: string): Paper | undefined => {
  return getPapers().find(p => p.id === id);
};

export const deletePaper = (id: string): void => {
  const papers = getPapers().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
};