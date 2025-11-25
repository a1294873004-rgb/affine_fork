import { ConfirmModalProvider, PromptModalProvider } from '@affine/component';
import { ProviderComposer } from '@affine/component/provider-composer';
import { ThemeProvider } from '@affine/core/components/theme-provider';
import type { createStore } from 'jotai';
import { Provider } from 'jotai';
import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';

export type AffineContextProps = PropsWithChildren<{
  store?: ReturnType<typeof createStore>;
}>;
/**
返回

<Provider store={store}>
  <ThemeProvider>
    <ConfirmModalProvider>
      <PromptModalProvider>
        {props.children}
      </PromptModalProvider>
    </ConfirmModalProvider>
  </ThemeProvider>
</Provider>
 */
export function AffineContext(props: AffineContextProps) {
  return (
    <ProviderComposer
      contexts={useMemo(
        () =>
          [
            <Provider key="JotaiProvider" store={props.store} />,
            <ThemeProvider key="ThemeProvider" />,
            <ConfirmModalProvider key="ConfirmModalProvider" />,
            <PromptModalProvider key="PromptModalProvider" />,
          ].filter(Boolean),
        [props.store]
      )}
    >
      {props.children}
    </ProviderComposer>
  );
}
