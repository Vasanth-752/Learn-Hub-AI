import fs from 'fs';
import path from 'path';

const uiDir = path.join(process.cwd(), 'apps/web/src/components/ui');
const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(uiDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/from '\.\.\/lib\/utils'/g, "from '../../lib/utils'");
  
  if (file === 'Tabs.tsx') {
    content = content.replace(
      "import { createContext, useContext, useState, ReactNode } from 'react';",
      "import { createContext, useContext, useState, type ReactNode } from 'react';"
    );
  }
  
  fs.writeFileSync(filePath, content);
}

const authDir = path.join(process.cwd(), 'apps/web/src/components/auth');
const protectedRouteFile = path.join(authDir, 'ProtectedRoute.tsx');
if (fs.existsSync(protectedRouteFile)) {
  let prContent = fs.readFileSync(protectedRouteFile, 'utf-8');
  prContent = prContent.replace(/from '\.\.\/stores\/authStore'/g, "from '../../stores/authStore'");
  fs.writeFileSync(protectedRouteFile, prContent);
}

// fix AuthCallbackPage
const authCallbackFile = path.join(process.cwd(), 'apps/web/src/pages/AuthCallbackPage.tsx');
if (fs.existsSync(authCallbackFile)) {
  let acContent = fs.readFileSync(authCallbackFile, 'utf-8');
  acContent = acContent.replace("import { useEffect } from 'react';", "import { useEffect, useState } from 'react';");
  fs.writeFileSync(authCallbackFile, acContent);
}
console.log('Fixed files');
