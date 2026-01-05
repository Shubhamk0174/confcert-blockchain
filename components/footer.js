'use client';

import Image from 'next/image';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            Made with
            <Heart className="h-4 w-4 text-red-500 fill-red-500 " />
            by
            <span className="font-semibold text-foreground">Shubham</span>
          </span>
          
          <span className="hidden sm:inline text-muted-foreground/50">•</span>
          
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Shubhamk0174"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110 hover:opacity-80"
              aria-label="GitHub Profile"
            >
              <Image
                src="/icons/icons8-github-64.png"
                alt="GitHub"
                width={20}
                height={20}
                className="dark:invert"
              />
            </a>
            
            <a
              href="https://www.linkedin.com/in/shubhamkumar-profile/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110 hover:opacity-80"
              aria-label="LinkedIn Profile"
            >
              <Image
                src="/icons/icons8-linkedin-96.png"
                alt="LinkedIn"
                width={20}
                height={20}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
