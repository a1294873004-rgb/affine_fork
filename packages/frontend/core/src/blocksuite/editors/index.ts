import { createReactComponentFromLit } from '@affine/component';
import { DocTitle } from '@blocksuite/affine/fragments/doc-title';
import React from 'react';

import { EdgelessEditor } from './edgeless-editor';
import { PageEditor } from './page-editor';

export * from './edgeless-editor';
export * from './page-editor';

export const LitDocEditor = createReactComponentFromLit({
  react: React,
  elementClass: PageEditor,
});

export const LitDocTitle = createReactComponentFromLit({
  react: React,
  elementClass: DocTitle,
});

export const LitEdgelessEditor = createReactComponentFromLit({
  react: React,
  elementClass: EdgelessEditor,
});

export function editorEffects() {
  customElements.define('page-editor', PageEditor);
  //  注册自定义元素 ,，否则 <edgeless-editor> 无法使用
  customElements.define('edgeless-editor', EdgelessEditor);
}
