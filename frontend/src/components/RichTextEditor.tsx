'use client';

import { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { uploadAvisoInlineImagem } from '@/lib/avisos-api';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TiptapImage,
      Placeholder.configure({ placeholder: 'Escreva a notícia aqui…' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'rte-content' },
    },
  });

  if (!editor) return null;

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;
    try {
      const url = await uploadAvisoInlineImagem(file);
      editor.chain().focus().setImage({ src: url }).run();
      // Sem isso, a imagem fica selecionada como nó e a próxima tecla
      // digitada a substitui em vez de inserir texto depois dela.
      editor.commands.setTextSelection(editor.state.selection.to);
    } catch {
      alert('Erro ao enviar a imagem. Tente novamente.');
    }
  }

  function addLink() {
    const url = window.prompt('URL do link:');
    if (!url) return;
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button type="button" className={editor.isActive('bold') ? 'active' : ''} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito">
          <span className="material-icons-outlined">format_bold</span>
        </button>
        <button type="button" className={editor.isActive('italic') ? 'active' : ''} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico">
          <span className="material-icons-outlined">format_italic</span>
        </button>
        <button type="button" className={editor.isActive('heading', { level: 2 }) ? 'active' : ''} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título">
          <span className="material-icons-outlined">title</span>
        </button>
        <button type="button" className={editor.isActive('heading', { level: 3 }) ? 'active' : ''} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subtítulo">
          <span className="material-icons-outlined">text_fields</span>
        </button>
        <button type="button" className={editor.isActive('bulletList') ? 'active' : ''} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
          <span className="material-icons-outlined">format_list_bulleted</span>
        </button>
        <button type="button" className={editor.isActive('orderedList') ? 'active' : ''} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <span className="material-icons-outlined">format_list_numbered</span>
        </button>
        <button type="button" className={editor.isActive('blockquote') ? 'active' : ''} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citação">
          <span className="material-icons-outlined">format_quote</span>
        </button>
        <button type="button" className={editor.isActive('link') ? 'active' : ''} onClick={addLink} title="Link">
          <span className="material-icons-outlined">link</span>
        </button>
        <button type="button" onClick={() => imageInputRef.current?.click()} title="Inserir imagem">
          <span className="material-icons-outlined">image</span>
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImagePick}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
