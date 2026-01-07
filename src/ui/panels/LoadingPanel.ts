import { UIModal } from '../core/UIModal';
import { UIProgressBar } from '../components/UIProgressBar';
import { UIText } from '../components/UIText';

/**
 * 加载/读条面板
 */
export class LoadingPanel extends UIModal {
  private progressBar: UIProgressBar;
  private textLabel: UIText;
  private progressText: string = '读条中';

  constructor() {
    super('loading');

    // 设置面板尺寸和位置（居中）
    this.width = 400;
    this.height = 100;
    this.x = (1280 - this.width) / 2;
    this.y = (720 - this.height) / 2;

    // 创建进度条
    this.progressBar = new UIProgressBar(300, 30);
    this.progressBar.x = (this.width - this.progressBar.width) / 2;
    this.progressBar.y = 50;
    this.addChild(this.progressBar);

    // 创建文本标签
    this.textLabel = new UIText('读条中');
    this.textLabel.fontSize = 18;
    this.textLabel.color = '#ffffff';
    this.textLabel.align = 'center';
    this.textLabel.baseline = 'middle';
    this.textLabel.width = this.width;
    this.textLabel.height = 30;
    this.textLabel.x = 0;
    this.textLabel.y = 10;
    this.addChild(this.textLabel);
  }

  /**
   * 设置进度
   */
  setProgress(progress: number, text?: string): void {
    this.progressBar.setValue(progress);
    if (text !== undefined) {
      this.progressText = text;
      this.textLabel.setText(text);
    }
  }

  /**
   * 获取当前进度
   */
  getProgress(): number {
    return this.progressBar.value;
  }
}
