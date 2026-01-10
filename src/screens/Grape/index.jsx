'use client';
import React from 'react';
import WebBuilder from './WebBuilder';
import { registerEditorBehavior } from './editorBehavior';

import './styles.css';

export default function GrapeScreen() {
  return (
    <div className="gjs-wrapper">
      <WebBuilder />
    </div>
  );
}
