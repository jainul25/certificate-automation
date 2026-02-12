import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
} from 'lucide-react'
import { useLetterhead } from '../../contexts/LetterheadContext'

export default function ContentEditor() {
  const { state, dispatch } = useLetterhead()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
    ],
    content: state.editorContent || '<p>Start typing your content here...</p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      dispatch({ type: 'SET_EDITOR_CONTENT', payload: html })
    },
  })

  if (!editor) {
    return null
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="space-y-4">
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="bg-slate-50 border-b border-slate-300 p-2 flex flex-wrap gap-2">
          {/* Text formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-slate-200 ${
              editor.isActive('bold') ? 'bg-slate-300' : ''
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-slate-200 ${
              editor.isActive('italic') ? 'bg-slate-300' : ''
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-slate-200 ${
              editor.isActive('underline') ? 'bg-slate-300' : ''
            }`}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <div className="w-px bg-slate-300 mx-1" />

          {/* Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-slate-200 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-slate-300' : ''
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-slate-200 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-slate-300' : ''
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-slate-200 ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-slate-300' : ''
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px bg-slate-300 mx-1" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-slate-200 ${
              editor.isActive('bulletList') ? 'bg-slate-300' : ''
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-slate-200 ${
              editor.isActive('orderedList') ? 'bg-slate-300' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px bg-slate-300 mx-1" />

          {/* Advanced */}
          <button
            onClick={addTable}
            className="p-2 rounded hover:bg-slate-200"
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-slate-200"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <div className="w-px bg-slate-300 mx-1" />

          {/* Font size */}
          <select
            onChange={(e) => {
              const size = e.target.value
              if (size === 'heading1') editor.chain().focus().toggleHeading({ level: 1 }).run()
              else if (size === 'heading2') editor.chain().focus().toggleHeading({ level: 2 }).run()
              else if (size === 'heading3') editor.chain().focus().toggleHeading({ level: 3 }).run()
              else editor.chain().focus().setParagraph().run()
            }}
            className="px-2 py-1 text-sm border border-slate-300 rounded"
            title="Text Size"
          >
            <option value="paragraph">Normal</option>
            <option value="heading1">Heading 1</option>
            <option value="heading2">Heading 2</option>
            <option value="heading3">Heading 3</option>
          </select>
        </div>

        {/* Editor */}
        <div className="p-4 min-h-[400px] prose prose-slate max-w-none">
          <EditorContent editor={editor} />
        </div>
      </div>

      <style>{`
        .ProseMirror {
          outline: none;
        }

        .ProseMirror p {
          margin-bottom: 0.75rem;
        }

        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }

        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px solid #ddd;
          padding: 0.5rem;
        }

        .ProseMirror table th {
          background-color: #f3f4f6;
          font-weight: bold;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  )
}
