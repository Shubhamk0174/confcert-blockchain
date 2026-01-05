'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Type, 
  Upload, 
  Save, 
  Trash2,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Copy,
  RotateCw,
  Grid3x3
} from 'lucide-react';
import localforage from 'localforage';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_RATIO } from '@/lib/canvas-constants';

const fonts = [
  { name: 'Serif', value: 'serif' },
  { name: 'Sans Serif', value: 'sans-serif' },
  { name: 'Monospace', value: 'monospace' },
  { name: 'Arial', value: 'Arial' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Courier New', value: 'Courier New' },
];

export default function CertificateEditor({ mode, onBack, initialTemplate }) {
  // Sanitize functions moved outside useEffect for reuse in initial state
  const sanitizeTextElements = (elements) => {
    return elements.map(el => ({
      ...el,
      fontSize: Number(el.fontSize) || 24,
      x: Number(el.x) || 0,
      y: Number(el.y) || 0,
      width: Number(el.width) || 200,
      height: Number(el.height) || 40,
      rotation: Number(el.rotation) || 0,
    }));
  };
  
  const sanitizeNamePlaceholder = (np) => ({
    ...np,
    fontSize: Number(np.fontSize) || 36,
    x: Number(np.x) || 0,
    y: Number(np.y) || 0,
    width: Number(np.width) || 300,
    height: Number(np.height) || 60,
    rotation: Number(np.rotation) || 0,
  });
  
  const sanitizeLogo = (lg) => lg ? {
    ...lg,
    width: Number(lg.width) || 100,
    height: Number(lg.height) || 100,
  } : null;

  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'tl', 'tr', 'bl', 'br'
  const [zoom, setZoom] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [backgroundImage, setBackgroundImage] = useState(() => {
    if (initialTemplate) return initialTemplate.backgroundImage;
    return mode === 'default' ? '/certificate_bg/image1.png' : null;
  });
  const [templateName, setTemplateName] = useState(() => {
    if (initialTemplate) return initialTemplate.name || '';
    return '';
  });
  const [textElements, setTextElements] = useState(() => {
    if (initialTemplate) return sanitizeTextElements(initialTemplate.textElements || []);
    return mode === 'default'
      ? [
          {
            id: 1,
            text: 'CERTIFICATE OF ACHIEVEMENT',
            x: CANVAS_WIDTH / 2 - 200,
            y: 100,
            width: 400,
            height: 60,
            fontSize: 32,
            fontFamily: 'serif',
            fontWeight: 'bold',
            color: '#000000',
            align: 'center',
            rotation: 0,
            isDragging: false,
          },
          {
            id: 2,
            text: 'This certificate is awarded to',
            x: CANVAS_WIDTH / 2 - 150,
            y: 250,
            width: 300,
            height: 40,
            fontSize: 20,
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            color: '#333333',
            align: 'center',
            rotation: 0,
            isDragging: false,
          },
          {
            id: 3,
            text: 'for successfully completing the program',
            x: CANVAS_WIDTH / 2 - 200,
            y: 450,
            width: 400,
            height: 40,
            fontSize: 18,
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            color: '#666666',
            align: 'center',
            rotation: 0,
            isDragging: false,
          },
        ]
      : [];
  });
  const [namePlaceholder, setNamePlaceholder] = useState(() => {
    if (initialTemplate) return sanitizeNamePlaceholder(initialTemplate.namePlaceholder);
    return {
      x: CANVAS_WIDTH / 2 - 150,
      y: 320,
      width: 300,
      height: 60,
      fontSize: 36,
      fontFamily: 'serif',
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      rotation: 0,
      isDragging: false,
    };
  });
  const [logo, setLogo] = useState(() => {
    if (initialTemplate) return sanitizeLogo(initialTemplate.logo);
    return null;
  });
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElementType, setSelectedElementType] = useState(null); // 'text', 'name', 'logo'
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const generateDefaultName = async () => {
    try {
      const templates = (await localforage.getItem('certificateTemplates')) || [];
      const templateNames = templates.map(t => t.name || '').filter(name => name.startsWith('Template '));
      const numbers = templateNames.map(name => {
        const match = name.match(/^Template (\d+)$/);
        return match ? parseInt(match[1]) : 0;
      });
      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      return `Template ${maxNumber + 1}`;
    } catch (error) {
      console.error('Error generating default name:', error);
      return 'Template 1';
    }
  };

  // Save state to history for undo/redo
  const saveToHistory = useCallback(() => {
    const state = {
      textElements: JSON.parse(JSON.stringify(textElements)),
      namePlaceholder: JSON.parse(JSON.stringify(namePlaceholder)),
      logo: logo ? JSON.parse(JSON.stringify(logo)) : null,
      backgroundImage,
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [textElements, namePlaceholder, logo, backgroundImage, history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setTextElements(state.textElements);
      setNamePlaceholder(state.namePlaceholder);
      setLogo(state.logo);
      setBackgroundImage(state.backgroundImage);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setTextElements(state.textElements);
      setNamePlaceholder(state.namePlaceholder);
      setLogo(state.logo);
      setBackgroundImage(state.backgroundImage);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Snap to grid helper
  const snapValue = useCallback((value) => {
    if (!snapToGrid) return value;
    const gridSize = 20;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid]);

  // Measure text width
  const measureText = useCallback((text, fontSize, fontFamily, fontWeight) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    return ctx.measureText(text).width;
  }, []);

  // Auto-resize text box based on content
  const autoResizeTextBox = useCallback((element) => {
    const textWidth = measureText(element.text, element.fontSize, element.fontFamily, element.fontWeight);
    const padding = 20;
    const minWidth = 100;
    const newWidth = Math.max(minWidth, textWidth + padding);
    const newHeight = element.fontSize * 1.5; // Line height factor
    
    return {
      ...element,
      width: newWidth,
      height: newHeight,
    };
  }, [measureText]);

  // Duplicate element function
  const duplicateElement = useCallback(() => {
    if (selectedElementType === 'text' && selectedElement) {
      setTextElements(prev => {
        const element = prev.find(el => el.id === selectedElement);
        if (element) {
          const newId = Math.max(0, ...prev.map((el) => el.id)) + 1;
          const duplicated = {
            ...element,
            id: newId,
            x: element.x + 20,
            y: element.y + 20,
          };
          setTimeout(() => saveToHistory(), 0);
          return [...prev, duplicated];
        }
        return prev;
      });
      setSelectedElement(prev => {
        const newId = Math.max(0, ...textElements.map((el) => el.id)) + 1;
        return newId;
      });
    } else if (selectedElementType === 'logo' && logo) {
      const duplicated = {
        ...logo,
        x: logo.x + 20,
        y: logo.y + 20,
      };
      setLogo(duplicated);
      setTimeout(() => saveToHistory(), 0);
    }
  }, [selectedElementType, selectedElement, textElements, logo, saveToHistory]);

  // Delete element function
  const deleteSelectedElement = useCallback(() => {
    if (selectedElementType === 'text' && selectedElement) {
      setTextElements((prev) => prev.filter((el) => el.id !== selectedElement));
      setSelectedElement(null);
      setSelectedElementType(null);
      setTimeout(() => saveToHistory(), 0);
    } else if (selectedElementType === 'logo') {
      setLogo(null);
      setSelectedElement(null);
      setSelectedElementType(null);
      setTimeout(() => saveToHistory(), 0);
    }
  }, [selectedElementType, selectedElement, saveToHistory]);

  // Generate default template name for new templates
  useEffect(() => {
    if (!initialTemplate) {
      generateDefaultName().then(setTemplateName);
    }
  }, [initialTemplate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in input fields
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
        return;
      }

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementType && selectedElement !== null) {
        e.preventDefault();
        deleteSelectedElement();
      }
      // Duplicate: Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateElement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedElement, selectedElementType, deleteSelectedElement, duplicateElement]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        drawElements();
      };
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawElements();
    }

    function drawElements() {
      // Draw grid if snap is enabled
      if (snapToGrid) {
        drawGrid(ctx);
      }

      // Draw logo
      if (logo) {
        const img = new Image();
        img.src = logo.url;
        img.onload = () => {
          ctx.drawImage(img, logo.x, logo.y, logo.width, logo.height);
          if (selectedElementType === 'logo') {
            drawSelectionBox(logo);
          }
        };
      }

      // Draw text elements
      textElements.forEach((element) => {
        drawTextElement(ctx, element);
        if (selectedElementType === 'text' && selectedElement === element.id) {
          drawSelectionBox(element);
        }
      });

      // Draw name placeholder
      ctx.save();
      if (namePlaceholder.rotation) {
        const centerX = namePlaceholder.x + namePlaceholder.width / 2;
        const centerY = namePlaceholder.y + namePlaceholder.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((namePlaceholder.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }
      ctx.fillStyle = namePlaceholder.color + '80'; // Semi-transparent
      ctx.font = `${namePlaceholder.fontWeight} ${namePlaceholder.fontSize}px ${namePlaceholder.fontFamily}`;
      ctx.textAlign = namePlaceholder.align;
      ctx.textBaseline = 'top';
      const textX = namePlaceholder.align === 'center' 
        ? namePlaceholder.x + namePlaceholder.width / 2 
        : namePlaceholder.align === 'right'
        ? namePlaceholder.x + namePlaceholder.width
        : namePlaceholder.x;
      ctx.fillText('<name>', textX, namePlaceholder.y);
      ctx.restore();

      if (selectedElementType === 'name') {
        drawSelectionBox(namePlaceholder);
      }
    }

    function drawGrid(ctx) {
      const gridSize = 20;
      ctx.strokeStyle = '#e5e5e5';
      ctx.lineWidth = 0.5;
      
      for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      
      for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
    }

    function drawTextElement(ctx, element) {
      ctx.save();
      
      if (element.rotation) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }
      
      ctx.fillStyle = element.color;
      ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
      ctx.textAlign = element.align;
      ctx.textBaseline = 'top';
      
      const textX = element.align === 'center' 
        ? element.x + element.width / 2 
        : element.align === 'right'
        ? element.x + element.width
        : element.x;
      
      ctx.fillText(element.text, textX, element.y);
      ctx.restore();
    }

    function drawSelectionBox(element) {
      ctx.save();
      
      if (element.rotation) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }
      
      // Draw selection box with shadow
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 4;
      ctx.strokeRect(element.x, element.y, element.width, element.height);
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      
      // Draw resize handles with gradient effect
      const handleSize = 10;
      const handles = [
        { x: element.x, y: element.y }, // Top-left
        { x: element.x + element.width, y: element.y }, // Top-right
        { x: element.x, y: element.y + element.height }, // Bottom-left
        { x: element.x + element.width, y: element.y + element.height }, // Bottom-right
      ];

      handles.forEach(handle => {
        // White border
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(handle.x - handleSize / 2 - 1, handle.y - handleSize / 2 - 1, handleSize + 2, handleSize + 2);
        // Blue fill
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      });
      
      ctx.restore();
    }
  }, [backgroundImage, textElements, logo, namePlaceholder, selectedElement, selectedElementType, snapToGrid]);

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check for resize handle on selected element
    if (selectedElementType && selectedElement !== null) {
      let currentElement;
      if (selectedElementType === 'name') {
        currentElement = namePlaceholder;
      } else if (selectedElementType === 'logo') {
        currentElement = logo;
      } else if (selectedElementType === 'text') {
        currentElement = textElements.find(el => el.id === selectedElement);
      }

      if (currentElement) {
        const handle = getResizeHandle(x, y, currentElement);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setResizeStart({
            width: currentElement.width,
            height: currentElement.height,
            x: currentElement.x,
            y: currentElement.y,
            mouseX: x,
            mouseY: y,
          });
          return;
        }
      }
    }

    // Check if clicking on name placeholder
    if (isInsideElement(x, y, namePlaceholder)) {
      setSelectedElement(null);
      setSelectedElementType('name');
      setDragOffset({ x: x - namePlaceholder.x, y: y - namePlaceholder.y });
      setIsDragging(true);
      return;
    }

    // Check if clicking on logo
    if (logo && isInsideElement(x, y, logo)) {
      setSelectedElement(null);
      setSelectedElementType('logo');
      setDragOffset({ x: x - logo.x, y: y - logo.y });
      setIsDragging(true);
      return;
    }

    // Check if clicking on text element
    for (let i = textElements.length - 1; i >= 0; i--) {
      if (isInsideElement(x, y, textElements[i])) {
        setSelectedElement(textElements[i].id);
        setSelectedElementType('text');
        setDragOffset({ x: x - textElements[i].x, y: y - textElements[i].y });
        setIsDragging(true);
        return;
      }
    }

    // Deselect if clicking on empty area
    setSelectedElement(null);
    setSelectedElementType(null);
  };

  const getResizeHandle = (x, y, element) => {
    const handleSize = 10;
    const tolerance = 15;

    // Top-left
    if (Math.abs(x - element.x) < tolerance && Math.abs(y - element.y) < tolerance) {
      return 'tl';
    }
    // Top-right
    if (Math.abs(x - (element.x + element.width)) < tolerance && Math.abs(y - element.y) < tolerance) {
      return 'tr';
    }
    // Bottom-left
    if (Math.abs(x - element.x) < tolerance && Math.abs(y - (element.y + element.height)) < tolerance) {
      return 'bl';
    }
    // Bottom-right
    if (Math.abs(x - (element.x + element.width)) < tolerance && Math.abs(y - (element.y + element.height)) < tolerance) {
      return 'br';
    }

    return null;
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Handle resizing
    if (isResizing && resizeHandle && selectedElementType) {
      const deltaX = x - resizeStart.mouseX;
      const deltaY = y - resizeStart.mouseY;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.x;
      let newY = resizeStart.y;

      switch (resizeHandle) {
        case 'tl':
          newWidth = resizeStart.width - deltaX;
          newHeight = resizeStart.height - deltaY;
          newX = resizeStart.x + deltaX;
          newY = resizeStart.y + deltaY;
          break;
        case 'tr':
          newWidth = resizeStart.width + deltaX;
          newHeight = resizeStart.height - deltaY;
          newY = resizeStart.y + deltaY;
          break;
        case 'bl':
          newWidth = resizeStart.width - deltaX;
          newHeight = resizeStart.height + deltaY;
          newX = resizeStart.x + deltaX;
          break;
        case 'br':
          newWidth = resizeStart.width + deltaX;
          newHeight = resizeStart.height + deltaY;
          break;
      }

      // Minimum size constraints
      newWidth = Math.max(50, newWidth);
      newHeight = Math.max(30, newHeight);

      // Apply snap to grid
      newX = snapValue(newX);
      newY = snapValue(newY);
      newWidth = snapValue(newWidth);
      newHeight = snapValue(newHeight);

      if (selectedElementType === 'name') {
        setNamePlaceholder(prev => ({
          ...prev,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        }));
      } else if (selectedElementType === 'logo' && logo) {
        setLogo(prev => ({
          ...prev,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        }));
      } else if (selectedElementType === 'text' && selectedElement) {
        setTextElements(prev =>
          prev.map(el =>
            el.id === selectedElement
              ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight }
              : el
          )
        );
      }
      return;
    }

    // Handle dragging
    if (!isDragging || !selectedElementType) return;

    const snappedX = snapValue(x - dragOffset.x);
    const snappedY = snapValue(y - dragOffset.y);

    if (selectedElementType === 'name') {
      setNamePlaceholder((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(snappedX, CANVAS_WIDTH - prev.width)),
        y: Math.max(0, Math.min(snappedY, CANVAS_HEIGHT - prev.height)),
      }));
    } else if (selectedElementType === 'logo' && logo) {
      setLogo((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(snappedX, CANVAS_WIDTH - prev.width)),
        y: Math.max(0, Math.min(snappedY, CANVAS_HEIGHT - prev.height)),
      }));
    } else if (selectedElementType === 'text' && selectedElement) {
      setTextElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement
            ? {
                ...el,
                x: Math.max(0, Math.min(snappedX, CANVAS_WIDTH - el.width)),
                y: Math.max(0, Math.min(snappedY, CANVAS_HEIGHT - el.height)),
              }
            : el
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDragging || isResizing) {
      saveToHistory();
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const isInsideElement = (x, y, element) => {
    return (
      x >= element.x &&
      x <= element.x + element.width &&
      y >= element.y &&
      y <= element.y + element.height
    );
  };

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo({
          url: event.target.result,
          x: 50,
          y: 50,
          width: 100,
          height: 100,
        });
        setSelectedElement(null);
        setSelectedElementType('logo');
      };
      reader.readAsDataURL(file);
    }
  };

  const addTextElement = () => {
    const newId = Math.max(0, ...textElements.map((el) => el.id)) + 1;
    const newElement = {
      id: newId,
      text: 'New Text',
      x: 100,
      y: 100,
      width: 200,
      height: 40,
      fontSize: 24,
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      rotation: 0,
      isDragging: false,
    };
    const resizedElement = autoResizeTextBox(newElement);
    setTextElements([...textElements, resizedElement]);
    setSelectedElement(newId);
    setSelectedElementType('text');
    saveToHistory();
  };

  const updateSelectedText = (property, value) => {
    if (selectedElementType === 'text' && selectedElement) {
      setTextElements((prev) => {
        const updated = prev.map((el) => {
          if (el.id === selectedElement) {
            const updatedEl = { ...el, [property]: value };
            // Auto-resize when text, fontSize, fontFamily, or fontWeight changes
            if (['text', 'fontSize', 'fontFamily', 'fontWeight'].includes(property)) {
              return autoResizeTextBox(updatedEl);
            }
            return updatedEl;
          }
          return el;
        });
        return updated;
      });
    }
  };

  const updateNamePlaceholder = (property, value) => {
    setNamePlaceholder((prev) => ({ ...prev, [property]: value }));
  };

  const updateLogo = (property, value) => {
    setLogo((prev) => ({ ...prev, [property]: value }));
  };

  const saveTemplate = async () => {
    const templateData = {
      id: initialTemplate ? initialTemplate.id : Date.now(),
      name: templateName || 'Unnamed Template',
      backgroundImage,
      textElements,
      namePlaceholder,
      logo,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      mode,
      savedAt: new Date().toISOString(),
    };
    
    try {
      const templates = (await localforage.getItem('certificateTemplates')) || [];
      
      if (initialTemplate) {
        // update existing
        const index = templates.findIndex(t => t.id === initialTemplate.id);
        if (index !== -1) {
          templates[index] = templateData;
        }
      } else {
        // add new
        templates.push(templateData);
      }
      
      await localforage.setItem('certificateTemplates', templates);
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    }
  };

  const getSelectedTextElement = () => {
    if (selectedElementType !== 'text' || !selectedElement) return null;
    return textElements.find((el) => el.id === selectedElement);
  };

  const selectedText = getSelectedTextElement();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-20 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="text-neutral-900 dark:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {mode === 'default' ? 'Edit Default Template' : 'Create Custom Template'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600 dark:text-neutral-400">Template Name:</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-48 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                placeholder="Enter template name"
              />
            </div>
            <Button onClick={saveTemplate} className="gap-2">
              <Save className="w-4 h-4" />
              Save Template
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 mb-4">
          <CardContent className="">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-neutral-700 mx-2" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={duplicateElement}
                  disabled={!selectedElement && selectedElementType !== 'logo'}
                  title="Duplicate (Ctrl+D)"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={deleteSelectedElement}
                  disabled={!selectedElement && selectedElementType !== 'logo'}
                  title="Delete (Del)"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={snapToGrid ? 'default' : 'outline'}
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  title="Snap to Grid"
                  className={snapToGrid ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                {snapToGrid && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Grid: 20px</span>
                )}
                <div className="w-px h-6 bg-neutral-700 mx-2" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-neutral-600 dark:text-neutral-400 min-w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          {/* Canvas Area */}
          <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <CardContent className="p-6">
              <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg overflow-auto">
                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="border border-neutral-700 bg-white"
                    style={{ 
                      width: `${CANVAS_WIDTH}px`,
                      height: `${CANVAS_HEIGHT}px`,
                      cursor: isResizing ? 'nwse-resize' : isDragging ? 'grabbing' : 'default',
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools Panel */}
          <div className="space-y-4">
            {/* Keyboard Shortcuts Help */}
            {/* <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                  <span>⌨️</span> Keyboard Shortcuts
                </h3>
                <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                  <div className="flex justify-between items-center">
                    <span>Undo:</span>
                    <code className="bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300 font-mono">Ctrl + Z</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Redo:</span>
                    <code className="bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300 font-mono">Ctrl + Y</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Duplicate:</span>
                    <code className="bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300 font-mono">Ctrl + D</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Delete:</span>
                    <code className="bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300 font-mono">Del</code>
                  </div>
                </div>
              </CardContent>
            </Card> */}

            {/* Add Elements */}
            <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Add Elements</h3>
                {selectedElement || selectedElementType ? (
                  <div className="mb-3 p-2.5 bg-primary/10 border border-primary/30 rounded-md text-xs text-neutral-900 dark:text-white font-medium flex items-center gap-2">
                    <span className="text-primary">●</span>
                    {selectedElementType === 'name' ? 'Name Placeholder' : 
                     selectedElementType === 'logo' ? 'Logo' : 'Text Element'} Selected
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Button onClick={addTextElement} className="w-full justify-start gap-2" variant="outline">
                    <Type className="w-4 h-4" />
                    Add Text
                  </Button>
                  <label className="block">
                    <Button asChild className="w-full justify-start gap-2" variant="outline">
                      <span>
                        <ImageIcon className="w-4 h-4" />
                        Background Image
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />
                  </label>
                  <label className="block">
                    <Button asChild className="w-full justify-start gap-2" variant="outline">
                      <span>
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Element Properties */}
            {selectedElementType === 'text' && selectedText && (
              <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Text Properties</h3>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={deleteSelectedElement}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Text</label>
                      <Input
                        value={selectedText.text}
                        onChange={(e) => updateSelectedText('text', e.target.value)}
                        className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Font</label>
                      <select
                        value={selectedText.fontFamily}
                        onChange={(e) => updateSelectedText('fontFamily', e.target.value)}
                        className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                      >
                        {fonts.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Size</label>
                      <Input
                        type="number"
                        value={selectedText.fontSize ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          updateSelectedText('fontSize', val);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '' || Number(e.target.value) === 0 || isNaN(Number(e.target.value))) {
                            updateSelectedText('fontSize', 12);
                          }
                        }}
                        placeholder="12"
                        className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Weight</label>
                      <select
                        value={selectedText.fontWeight}
                        onChange={(e) => updateSelectedText('fontWeight', e.target.value)}
                        className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Color</label>
                      <Input
                        type="color"
                        value={selectedText.color}
                        onChange={(e) => updateSelectedText('color', e.target.value)}
                        className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 h-10"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Alignment</label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={selectedText.align === 'left' ? 'default' : 'outline'}
                          onClick={() => updateSelectedText('align', 'left')}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedText.align === 'center' ? 'default' : 'outline'}
                          onClick={() => updateSelectedText('align', 'center')}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedText.align === 'right' ? 'default' : 'outline'}
                          onClick={() => updateSelectedText('align', 'right')}
                        >
                          <AlignRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Rotation (degrees)</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={selectedText.rotation ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            updateSelectedText('rotation', val);
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '' || isNaN(Number(e.target.value))) {
                              updateSelectedText('rotation', 0);
                            }
                          }}
                          placeholder="0"
                          className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white flex-1"
                          min="-180"
                          max="180"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSelectedText('rotation', 0)}
                          title="Reset Rotation"
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Size</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-neutral-700 dark:text-neutral-500">Width</label>
                          <Input
                            type="number"
                            value={selectedText.width ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              updateSelectedText('width', val);
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '' || Number(e.target.value) === 0 || isNaN(Number(e.target.value))) {
                                updateSelectedText('width', 50);
                              }
                            }}
                            placeholder="50"
                            className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-700 dark:text-neutral-500">Height</label>
                          <Input
                            type="number"
                            value={selectedText.height ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              updateSelectedText('height', val);
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '' || Number(e.target.value) === 0 || isNaN(Number(e.target.value))) {
                                updateSelectedText('height', 30);
                              }
                            }}
                            placeholder="30"
                            className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Name Placeholder Properties */}
            {selectedElementType === 'name' && (
              <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Name Placeholder</h3>
                  <div className="space-y-3">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                      This placeholder will be auto-filled with recipient names
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Font</label>
                      <select
                        value={namePlaceholder.fontFamily}
                        onChange={(e) => updateNamePlaceholder('fontFamily', e.target.value)}
                        className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                      >
                        {fonts.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Size</label>
                      <Input
                        type="number"
                        value={namePlaceholder.fontSize ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          updateNamePlaceholder('fontSize', val);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '' || Number(e.target.value) === 0 || isNaN(Number(e.target.value))) {
                            updateNamePlaceholder('fontSize', 12);
                          }
                        }}
                        placeholder="12"
                        className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Color</label>
                      <Input
                        type="color"
                        value={namePlaceholder.color}
                        onChange={(e) => updateNamePlaceholder('color', e.target.value)}
                        className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 h-10"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Alignment</label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={namePlaceholder.align === 'left' ? 'default' : 'outline'}
                          onClick={() => updateNamePlaceholder('align', 'left')}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={namePlaceholder.align === 'center' ? 'default' : 'outline'}
                          onClick={() => updateNamePlaceholder('align', 'center')}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={namePlaceholder.align === 'right' ? 'default' : 'outline'}
                          onClick={() => updateNamePlaceholder('align', 'right')}
                        >
                          <AlignRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Rotation (degrees)</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={namePlaceholder.rotation ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            updateNamePlaceholder('rotation', val);
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '' || isNaN(Number(e.target.value))) {
                              updateNamePlaceholder('rotation', 0);
                            }
                          }}
                          placeholder="0"
                          className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white flex-1"
                          min="-180"
                          max="180"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateNamePlaceholder('rotation', 0)}
                          title="Reset Rotation"
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Logo Properties */}
            {selectedElementType === 'logo' && logo && (
              <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Logo Properties</h3>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={deleteSelectedElement}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Width</label>
                      <Input
                        type="number"
                        value={logo.width ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          updateLogo('width', val);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '' || Number(e.target.value) === 0 || isNaN(Number(e.target.value))) {
                            updateLogo('width', 50);
                          }
                        }}
                        placeholder="50"
                        className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">Height</label>
                      <Input
                        type="number"
                        value={logo.height ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          updateLogo('height', val);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '' || Number(e.target.value) === 0 || isNaN(Number(e.target.value))) {
                            updateLogo('height', 50);
                          }
                        }}
                        placeholder="50"
                        className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}