import { TelegramMessage, BotResponse, TelegramInlineKeyboardMarkup, TelegramInlineKeyboardButton } from '../types/TelegramTypes';

export class TelegramUtils {
  /**
   * Format text for Telegram Markdown
   */
  static formatMarkdown(text: string): string {
    return text
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  }

  /**
   * Create a simple inline keyboard
   */
  static createInlineKeyboard(buttons: Array<{ text: string; callback_data: string }>): TelegramInlineKeyboardMarkup {
    const keyboard: TelegramInlineKeyboardButton[][] = [];
    let row: TelegramInlineKeyboardButton[] = [];

    buttons.forEach((button, index) => {
      row.push({
        text: button.text,
        callback_data: button.callback_data
      });

      // Create new row every 2 buttons or at the end
      if (row.length === 2 || index === buttons.length - 1) {
        keyboard.push(row);
        row = [];
      }
    });

    return { inline_keyboard: keyboard };
  }

  /**
   * Create mode selection keyboard
   */
  static createModeKeyboard(currentMode: string): TelegramInlineKeyboardMarkup {
    const modes = [
      { text: 'General', callback_data: 'mode_general' },
      { text: 'Code', callback_data: 'mode_code' },
      { text: 'Research', callback_data: 'mode_research' },
      { text: 'Reasoning', callback_data: 'mode_reasoning' }
    ];

    const buttons = modes.map(mode => ({
      text: mode.text === currentMode ? `✅ ${mode.text}` : mode.text,
      callback_data: mode.callback_data
    }));

    return this.createInlineKeyboard(buttons);
  }

  /**
   * Create model selection keyboard
   */
  static createModelKeyboard(models: string[], currentModel: string): TelegramInlineKeyboardMarkup {
    const buttons = models.map(model => ({
      text: model === currentModel ? `✅ ${model}` : model,
      callback_data: `model_${model}`
    }));

    return this.createInlineKeyboard(buttons);
  }

  /**
   * Truncate text to fit Telegram message limits
   */
  static truncateText(text: string, maxLength: number = 4096): string {
    if (text.length <= maxLength) return text;
    
    // Try to truncate at sentence boundary
    const truncated = text.substring(0, maxLength - 3);
    const lastSentence = truncated.lastIndexOf('. ');
    const lastNewline = truncated.lastIndexOf('\n');
    const lastBreak = Math.max(lastSentence, lastNewline);
    
    if (lastBreak > maxLength * 0.8) {
      return truncated.substring(0, lastBreak + 1) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Split long messages into multiple parts
   */
  static splitMessage(text: string, maxLength: number = 4096): string[] {
    if (text.length <= maxLength) return [text];

    const parts: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        parts.push(remaining);
        break;
      }

      // Try to split at sentence boundary
      const truncated = remaining.substring(0, maxLength);
      const lastSentence = truncated.lastIndexOf('. ');
      const lastNewline = truncated.lastIndexOf('\n');
      const lastBreak = Math.max(lastSentence, lastNewline);

      if (lastBreak > maxLength * 0.8) {
        parts.push(remaining.substring(0, lastBreak + 1));
        remaining = remaining.substring(lastBreak + 1).trim();
      } else {
        // Force split at maxLength
        parts.push(truncated);
        remaining = remaining.substring(maxLength).trim();
      }
    }

    return parts;
  }

  /**
   * Format code block for Telegram
   */
  static formatCodeBlock(code: string, language: string = ''): string {
    const lang = language ? language : '';
    return `\`\`\`${lang}\n${code}\n\`\`\``;
  }

  /**
   * Format inline code
   */
  static formatInlineCode(code: string): string {
    return `\`${code}\``;
  }

  /**
   * Format bold text
   */
  static formatBold(text: string): string {
    return `*${text}*`;
  }

  /**
   * Format italic text
   */
  static formatItalic(text: string): string {
    return `_${text}_`;
  }

  /**
   * Format link
   */
  static formatLink(text: string, url: string): string {
    return `[${text}](${url})`;
  }

  /**
   * Create a progress bar
   */
  static createProgressBar(current: number, total: number, width: number = 10): string {
    const percentage = Math.min(current / total, 1);
    const filled = Math.round(width * percentage);
    const empty = width - filled;
    
    const filledBar = '█'.repeat(filled);
    const emptyBar = '░'.repeat(empty);
    
    return `${filledBar}${emptyBar} ${Math.round(percentage * 100)}%`;
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Format duration in seconds
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Validate Telegram message
   */
  static validateMessage(message: TelegramMessage): boolean {
    return !!(message && message.chat && message.chat.id);
  }

  /**
   * Extract command and arguments from message text
   */
  static parseCommand(text: string): { command: string; args: string[] } | null {
    const match = text.match(/^\/(\w+)(?:\s+(.*))?$/);
    if (!match) return null;

    const [, command, argsText] = match;
    const args = argsText ? argsText.split(/\s+/) : [];

    return { command, args };
  }

  /**
   * Check if user is admin (placeholder for admin system)
   */
  static isAdmin(userId: number): boolean {
    // TODO: Implement proper admin system
    const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id.trim())) || [];
    return adminIds.includes(userId);
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();
  }

  /**
   * Create a table-like format for data
   */
  static createTable(headers: string[], rows: string[][]): string {
    if (rows.length === 0) return 'No data available';

    // Calculate column widths
    const columnWidths = headers.map((header, index) => {
      const maxWidth = Math.max(
        header.length,
        ...rows.map(row => (row[index] || '').length)
      );
      return Math.min(maxWidth, 20); // Cap at 20 characters
    });

    // Create header row
    let table = headers.map((header, index) => 
      header.padEnd(columnWidths[index])
    ).join(' | ') + '\n';

    // Add separator
    table += headers.map((_, index) => 
      '-'.repeat(columnWidths[index])
    ).join('-+-') + '\n';

    // Add data rows
    rows.forEach(row => {
      table += row.map((cell, index) => 
        (cell || '').padEnd(columnWidths[index])
      ).join(' | ') + '\n';
    });

    return table;
  }

  /**
   * Create a simple list format
   */
  static createList(items: string[], numbered: boolean = false): string {
    return items.map((item, index) => 
      numbered ? `${index + 1}. ${item}` : `• ${item}`
    ).join('\n');
  }

  /**
   * Escape special characters for Markdown
   */
  static escapeMarkdown(text: string): string {
    return text
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  }

  /**
   * Format timestamp
   */
  static formatTimestamp(timestamp: number | Date): string {
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;
    return date.toLocaleString();
  }

  /**
   * Create a simple status indicator
   */
  static createStatusIndicator(status: string): string {
    const indicators = {
      online: '🟢',
      offline: '🔴',
      busy: '🟡',
      away: '🟠',
      error: '🔴',
      warning: '🟡',
      success: '🟢',
      info: '🔵'
    };

    return `${indicators[status as keyof typeof indicators] || '⚪'} ${status}`;
  }
} 