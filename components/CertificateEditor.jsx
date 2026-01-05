'use client';

import { useState, useRef, useEffect } from 'react';
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
  AlignRight
} from 'lucide-react';
import localforage from 'localforage';

// Certificate aspect ratio (A4 landscape: 297mm x 210mm)
const CANVAS_RATIO = 297 / 210; // ~1.414
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = CANVAS_WIDTH / CANVAS_RATIO; // ~707

const fonts = [
  { name: 'Serif', value: 'serif' },
  { name: 'Sans Serif', value: 'sans-serif' },
  { name: 'Monospace', value: 'monospace' },
  { name: 'Arial', value: 'Arial' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Courier New', value: 'Courier New' },
];

export default function CertificateEditor({ mode, onBack, initialTemplate }) {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(
    mode === 'default' ? '/certificate_bg/image1.png' : null
  );
  const [templateName, setTemplateName] = useState('');
  const [textElements, setTextElements] = useState(
    mode === 'default'
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
            isDragging: false,
          },
        ]
      : []
  );
  const [namePlaceholder, setNamePlaceholder] = useState({
    x: CANVAS_WIDTH / 2 - 150,
    y: 320,
    width: 300,
    height: 60,
    fontSize: 36,
    fontFamily: 'serif',
    fontWeight: 'bold',
    color: '#000000',
    align: 'center',
    isDragging: false,
  });
  const [logo, setLogo] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElementType, setSelectedElementType] = useState(null); // 'text', 'name', 'logo'
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const generateDefaultName = async () => {
    try {
      const templates = (await localforage.getItem('certificateTemplates')) || [];
      const templateNames = templates.map(t => t.name || '').filter(name => name.startsWith('Template '));
      const numbers = templateNames.map(name => {
        const match = name.match(/^Template (\d+)$/);
        return match ? parseInt(match[1]) : 0;
      });
      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      setTemplateName(`Template ${maxNumber + 1}`);
    } catch (error) {
      console.error('Error generating default name:', error);
      setTemplateName('Template 1');
    }
  };

  // Load template from initialTemplate
  useEffect(() => {
    if (initialTemplate) {
      // Sanitize numeric values
      const sanitizeTextElements = (elements) => {
        return elements.map(el => ({
          ...el,
          fontSize: Number(el.fontSize) || 24,
          x: Number(el.x) || 0,
          y: Number(el.y) || 0,
          width: Number(el.width) || 200,
          height: Number(el.height) || 40,
        }));
      };
      
      const sanitizeNamePlaceholder = (np) => ({
        ...np,
        fontSize: Number(np.fontSize) || 36,
        x: Number(np.x) || 0,
        y: Number(np.y) || 0,
        width: Number(np.width) || 300,
        height: Number(np.height) || 60,
      });
      
      const sanitizeLogo = (lg) => lg ? {
        ...lg,
        width: Number(lg.width) || 100,
        height: Number(lg.height) || 100,
      } : null;
      
      setBackgroundImage(initialTemplate.backgroundImage);
      setTextElements(sanitizeTextElements(initialTemplate.textElements || []));
      setNamePlaceholder(sanitizeNamePlaceholder(initialTemplate.namePlaceholder));
      setLogo(sanitizeLogo(initialTemplate.logo));
      setTemplateName(initialTemplate.name || '');
    } else {
      // For new templates, generate default name
      generateDefaultName();
    }
  }, [initialTemplate]);

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

    function drawTextElement(ctx, element) {
      ctx.save();
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
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(element.x, element.y, element.width, element.height);
      ctx.setLineDash([]);
      
      // Draw resize handles
      const handleSize = 8;
      ctx.fillStyle = '#3b82f6';
      // Top-left
      ctx.fillRect(element.x - handleSize / 2, element.y - handleSize / 2, handleSize, handleSize);
      // Top-right
      ctx.fillRect(element.x + element.width - handleSize / 2, element.y - handleSize / 2, handleSize, handleSize);
      // Bottom-left
      ctx.fillRect(element.x - handleSize / 2, element.y + element.height - handleSize / 2, handleSize, handleSize);
      // Bottom-right
      ctx.fillRect(element.x + element.width - handleSize / 2, element.y + element.height - handleSize / 2, handleSize, handleSize);
    }
  }, [backgroundImage, textElements, logo, namePlaceholder, selectedElement, selectedElementType]);

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

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

  const handleCanvasMouseMove = (e) => {
    if (!isDragging || !selectedElementType) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (selectedElementType === 'name') {
      setNamePlaceholder((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(x - dragOffset.x, CANVAS_WIDTH - prev.width)),
        y: Math.max(0, Math.min(y - dragOffset.y, CANVAS_HEIGHT - prev.height)),
      }));
    } else if (selectedElementType === 'logo' && logo) {
      setLogo((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(x - dragOffset.x, CANVAS_WIDTH - prev.width)),
        y: Math.max(0, Math.min(y - dragOffset.y, CANVAS_HEIGHT - prev.height)),
      }));
    } else if (selectedElementType === 'text' && selectedElement) {
      setTextElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement
            ? {
                ...el,
                x: Math.max(0, Math.min(x - dragOffset.x, CANVAS_WIDTH - el.width)),
                y: Math.max(0, Math.min(y - dragOffset.y, CANVAS_HEIGHT - el.height)),
              }
            : el
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
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
    setTextElements([
      ...textElements,
      {
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
        isDragging: false,
      },
    ]);
    setSelectedElement(newId);
    setSelectedElementType('text');
  };

  const updateSelectedText = (property, value) => {
    if (selectedElementType === 'text' && selectedElement) {
      setTextElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement ? { ...el, [property]: value } : el
        )
      );
    }
  };

  const updateNamePlaceholder = (property, value) => {
    setNamePlaceholder((prev) => ({ ...prev, [property]: value }));
  };

  const updateLogo = (property, value) => {
    setLogo((prev) => ({ ...prev, [property]: value }));
  };

  const deleteSelectedElement = () => {
    if (selectedElementType === 'text' && selectedElement) {
      setTextElements((prev) => prev.filter((el) => el.id !== selectedElement));
      setSelectedElement(null);
      setSelectedElementType(null);
    } else if (selectedElementType === 'logo') {
      setLogo(null);
      setSelectedElement(null);
      setSelectedElementType(null);
    }
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
    <div className="min-h-screen bg-neutral-950 pt-20 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'default' ? 'Edit Default Template' : 'Create Custom Template'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-400">Template Name:</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-48 bg-neutral-800 border-neutral-700 text-white"
                placeholder="Enter template name"
              />
            </div>
            <Button onClick={saveTemplate} className="gap-2">
              <Save className="w-4 h-4" />
              Save Template
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          {/* Canvas Area */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="bg-neutral-800 p-4 rounded-lg">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="w-full h-auto border border-neutral-700 bg-white cursor-move"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tools Panel */}
          <div className="space-y-4">
            {/* Add Elements */}
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Add Elements</h3>
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
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Text Properties</h3>
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
                      <label className="text-sm text-neutral-400 mb-1 block">Text</label>
                      <Input
                        value={selectedText.text}
                        onChange={(e) => updateSelectedText('text', e.target.value)}
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Font</label>
                      <select
                        value={selectedText.fontFamily}
                        onChange={(e) => updateSelectedText('fontFamily', e.target.value)}
                        className="w-full p-2 rounded-md bg-neutral-800 border border-neutral-700 text-white"
                      >
                        {fonts.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Size</label>
                      <Input
                        type="number"
                        value={selectedText.fontSize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            updateSelectedText('fontSize', val);
                          }
                        }}
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Weight</label>
                      <select
                        value={selectedText.fontWeight}
                        onChange={(e) => updateSelectedText('fontWeight', e.target.value)}
                        className="w-full p-2 rounded-md bg-neutral-800 border border-neutral-700 text-white"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Color</label>
                      <Input
                        type="color"
                        value={selectedText.color}
                        onChange={(e) => updateSelectedText('color', e.target.value)}
                        className="bg-neutral-800 border-neutral-700 h-10"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Alignment</label>
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Name Placeholder Properties */}
            {selectedElementType === 'name' && (
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Name Placeholder</h3>
                  <div className="space-y-3">
                    <div className="text-sm text-neutral-400 mb-2">
                      This placeholder will be auto-filled with recipient names
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Font</label>
                      <select
                        value={namePlaceholder.fontFamily}
                        onChange={(e) => updateNamePlaceholder('fontFamily', e.target.value)}
                        className="w-full p-2 rounded-md bg-neutral-800 border border-neutral-700 text-white"
                      >
                        {fonts.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Size</label>
                      <Input
                        type="number"
                        value={namePlaceholder.fontSize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            updateNamePlaceholder('fontSize', val);
                          }
                        }}
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Color</label>
                      <Input
                        type="color"
                        value={namePlaceholder.color}
                        onChange={(e) => updateNamePlaceholder('color', e.target.value)}
                        className="bg-neutral-800 border-neutral-700 h-10"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Alignment</label>
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Logo Properties */}
            {selectedElementType === 'logo' && logo && (
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Logo Properties</h3>
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
                      <label className="text-sm text-neutral-400 mb-1 block">Width</label>
                      <Input
                        type="number"
                        value={logo.width}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            updateLogo('width', val);
                          }
                        }}
                        className="bg-neutral-800 border-neutral-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Height</label>
                      <Input
                        type="number"
                        value={logo.height}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            updateLogo('height', val);
                          }
                        }}
                        className="bg-neutral-800 border-neutral-700 text-white"
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
