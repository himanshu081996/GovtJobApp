import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

class DebugLogger {
  private static instance: DebugLogger;
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  static getInstance() {
    if (!this.instance) {
      this.instance = new DebugLogger();
    }
    return this.instance;
  }

  log(message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };

    this.logs.push(entry);

    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener([...this.logs]));

    // Also log to console
    console.log(`[${entry.timestamp}] ${message}`);
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    // Send current logs immediately
    listener([...this.logs]);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }
}

export const logger = DebugLogger.getInstance();

export const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = logger.subscribe(setLogs);
    return unsubscribe;
  }, []);

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.toggleText}>Show Debug ({logs.length})</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FCM Debug Console</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => logger.clear()} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.hideButton}>
            <Text style={styles.hideText}>Hide</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.logContainer} showsVerticalScrollIndicator={false}>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No logs yet...</Text>
        ) : (
          logs.map((log, index) => (
            <View key={index} style={styles.logEntry}>
              <Text style={styles.timestamp}>{log.timestamp}</Text>
              <Text style={[styles.logText, styles[log.type]]}>{log.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  toggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    height: Dimensions.get('window').height * 0.4,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 6,
    borderRadius: 4,
  },
  clearText: {
    color: 'white',
    fontSize: 12,
  },
  hideButton: {
    backgroundColor: '#8E8E93',
    padding: 6,
    borderRadius: 4,
  },
  hideText: {
    color: 'white',
    fontSize: 12,
  },
  logContainer: {
    flex: 1,
    padding: 8,
  },
  emptyText: {
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  logEntry: {
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  timestamp: {
    color: '#8E8E93',
    fontSize: 10,
    marginBottom: 2,
  },
  logText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  info: {
    color: '#007AFF',
  },
  success: {
    color: '#34C759',
  },
  error: {
    color: '#FF3B30',
  },
  warning: {
    color: '#FF9500',
  },
});