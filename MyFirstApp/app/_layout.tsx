import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { RecordsProvider } from '@/context/RecordsContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <RecordsProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="wine/[id]" 
            options={{ 
              title: 'ワイン詳細',
              headerBackTitle: '戻る'
            }} 
          />
          <Stack.Screen 
            name="wine/edit/[id]" 
            options={{ 
              title: 'ワインを編集',
              presentation: 'modal',
              headerBackTitle: '戻る'
            }} 
          />
          <Stack.Screen 
            name="sake/[id]" 
            options={{ 
              title: '日本酒詳細',
              headerBackTitle: '戻る'
            }} 
          />
          <Stack.Screen 
            name="sake/edit/[id]" 
            options={{ 
              title: '日本酒を編集',
              presentation: 'modal',
              headerBackTitle: '戻る'
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </RecordsProvider>
  );
}
