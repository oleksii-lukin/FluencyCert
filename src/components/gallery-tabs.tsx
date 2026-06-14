'use client'

import { useState } from 'react'

interface GalleryTabsProps {
  webLabel: string
  pdfLabel: string
  webContent: React.ReactNode
  pdfContent: React.ReactNode
}

export function GalleryTabs({ webLabel, pdfLabel, webContent, pdfContent }: GalleryTabsProps) {
  const [activeTab, setActiveTab] = useState<'web' | 'pdf'>('web')

  return (
    <>
      <div className="mb-8 flex gap-1 rounded-xl bg-muted p-1 w-fit" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'web'}
          onClick={() => setActiveTab('web')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'web'
              ? 'bg-white text-graphite shadow-sm dark:bg-graphite dark:text-snow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {webLabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'pdf'}
          onClick={() => setActiveTab('pdf')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'pdf'
              ? 'bg-white text-graphite shadow-sm dark:bg-graphite dark:text-snow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {pdfLabel}
        </button>
      </div>
      <div style={{ display: activeTab === 'web' ? '' : 'none' }}>
        {webContent}
      </div>
      <div style={{ display: activeTab === 'pdf' ? '' : 'none' }}>
        {pdfContent}
      </div>
    </>
  )
}
