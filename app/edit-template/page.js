'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Sparkles, Clock, Trash2, Edit3 } from 'lucide-react';
import Link from 'next/link';
import CertificateEditor from '@/components/CertificateEditor';
import localforage from 'localforage';

export default function EditTemplatePage() {
  const [editorMode, setEditorMode] = useState(null); // 'default' or 'custom'
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const loadSavedTemplates = async () => {
    try {
      let templates = await localforage.getItem('certificateTemplates');
      if (!templates) {
        // Try to migrate from localStorage
        let oldData = localStorage.getItem('certificateTemplates');
        if (!oldData) {
          oldData = localStorage.getItem('certificateTemplate'); // old single template
        }
        if (oldData) {
          const parsed = JSON.parse(oldData);
          templates = Array.isArray(parsed) ? parsed : [parsed];
          await localforage.setItem('certificateTemplates', templates);
          localStorage.removeItem('certificateTemplates');
          localStorage.removeItem('certificateTemplate'); // clean up
        } else {
          templates = [];
        }
      }
      setSavedTemplates(templates);
    } catch (error) {
      console.error('Error loading saved templates:', error);
      setSavedTemplates([]);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const templates = await localforage.getItem('certificateTemplates') || [];
        const updatedTemplates = templates.filter(t => t.id !== templateId);
        await localforage.setItem('certificateTemplates', updatedTemplates);
        setSavedTemplates(updatedTemplates);
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template');
      }
    }
  };

  const editSavedTemplate = (template) => {
    setEditingTemplate(template);
    setEditorMode(template.mode === 'default' ? 'default' : 'custom');
  };

  useEffect(() => {
    // Load saved templates on mount
    const loadTemplates = async () => {
      await loadSavedTemplates();
    };

    // Use setTimeout to defer state updates
    const timer = setTimeout(loadTemplates, 0);
    return () => clearTimeout(timer);
  }, []);

  if (editorMode) {
    return <CertificateEditor 
      mode={editorMode} 
      onBack={() => {
        setEditorMode(null);
        setEditingTemplate(null);
        loadSavedTemplates(); // Refresh saved templates after editing
      }}
      initialTemplate={editingTemplate}
    />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-900 dark:text-white">
            Create Certificate Template
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-12">
            Choose how you want to start designing your certificate
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Default Template Option */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary/50">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                      <FileText className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-white">
                      Edit Default Template
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                      Start with a professionally designed certificate template with pre-set background and text elements. Perfect for quick customization.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => setEditorMode('default')}
                      className="w-full"
                    >
                      Use Default Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Create Your Own Option */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary/50">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6">
                      <Sparkles className="w-10 h-10 text-purple-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-white">
                      Create Your Own
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                      Start from scratch with a blank canvas. Add your own background, text, logos, and design elements for complete creative freedom.
                    </p>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setEditorMode('custom')}
                      className="w-full"
                    >
                      Start from Scratch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Saved Templates Section */}
          {savedTemplates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-white">Saved Templates</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Card className="hover:shadow-xl transition-all duration-300 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-green-500/50">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-green-500" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-white">
                            {template.name || `Template ${index + 1}`}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(template.savedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2 w-full">
                            <Button
                              size="sm"
                              onClick={() => editSavedTemplate(template)}
                              className="flex-1 gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteTemplate(template.id)}
                              className="gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="mt-8 text-center">
            <Link href="/templates">
              <Button variant="ghost" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                ← Back to Templates
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
