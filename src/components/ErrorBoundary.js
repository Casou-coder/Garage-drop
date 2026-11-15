import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { C } from '../theme';
import { st } from '../styles';

// Filet de sécurité : si un écran plante, on propose de reprendre au lieu d'un écran blanc.
// La sauvegarde n'est pas touchée.
export class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={[st.root, { alignItems: 'center', justifyContent: 'center', padding: 30 }]}>
        <Text style={st.screenTitle}>Oups, une panne</Text>
        <Text style={[st.sectionHint, { textAlign: 'center', marginTop: 8 }]}>Un problème est survenu. Ta partie est sauvegardée.</Text>
        <Pressable onPress={() => this.setState({ error: null })} style={st.cta} accessibilityRole="button">
          <Text style={st.ctaText}>Reprendre</Text>
        </Pressable>
        <Text style={{ color: C.line, fontSize: 11, marginTop: 20 }} numberOfLines={3}>{String(this.state.error?.message || this.state.error)}</Text>
      </View>
    );
  }
}
