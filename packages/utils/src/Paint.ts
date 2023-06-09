import defaultsDeep from 'lodash/defaultsDeep';

interface IPaintProps {
    context: CanvasRenderingContext2D | null;
}

interface IPosition {
    startX: number;
    startY: number;
    width: number;
    height: number;
}

interface RoundRectProps {
    padding?: number;
    borderRadius?: number | number[];
    borderColor?: string;
    borderWidth?: number;
    position?: IPosition
}

interface IImageProps {
    url: string;
    dx: number;
    dy: number;
    dw: number;
    dh: number;
}

interface IRoundImage extends IImageProps {
    rect?: Omit<RoundRectProps, 'position'>
}

// eslint-disable-next-line no-undef
interface ITextProps extends Partial<CanvasTextDrawingStyles>, Pick<IPosition, 'startY' | 'startX'> {
    text: string;
    color?: string;
    isStroke?: boolean
}

interface IMultiTextProps extends ITextProps {
    maxWidth: number;
    maxHeight?: number;
    gap?: number;
}

const DEFAULT_BORDER: RoundRectProps = {
  padding: 0,
  borderRadius: 0,
  borderColor: "#000",
  borderWidth: 6,
  position: {
    startX: 0,
    startY: 0,
    width: 100,
    height: 100,
  },
}

class Paint {
  private context: CanvasRenderingContext2D;

  constructor(props: IPaintProps) {
    const { context } = props
    if (!context) {
      throw Error('Canvas Context cannot be NULL')
    }

    this.context = context;
  }

  get ctx() {
    return this.context
  }

  roundRect(props: RoundRectProps = {}) {
    const { context } = this;
    const config = defaultsDeep(props, DEFAULT_BORDER) as Required<RoundRectProps>

    const {
      padding, borderRadius, borderColor, borderWidth, position,
    } = config

    let innerBorderRadius: number[];

    if (typeof borderRadius === 'number') {
      innerBorderRadius = Array.from({ length: 4 }).fill(borderRadius) as number[]
    } else if (Array.isArray(borderRadius)) {
      if (borderRadius.length >= 4) {
        innerBorderRadius = borderRadius.slice(0, 4);
      } else if (borderRadius.length === 3) {
        innerBorderRadius = [...borderRadius, borderRadius[1]]
      } else if (borderRadius.length === 2) {
        innerBorderRadius = [...borderRadius, ...borderRadius]
      } else {
        innerBorderRadius = Array.from({
          length: 4,
        }).fill(borderRadius[0]) as number[]
      }
    } else {
      innerBorderRadius = [0, 0, 0, 0]
    }

    const offset = padding

    const startX = position.startX + offset;
    const startY = position.startY + offset;
    const endX = position.startX + position.width - offset;
    const endY = position.startY + position.height - offset;

    context.beginPath();
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;

    // top
    context.moveTo(startX + innerBorderRadius[0], startY);
    context.lineTo(endX - innerBorderRadius[1], startY);
    context.arcTo(endX, startY, endX, startY + innerBorderRadius[1], innerBorderRadius[1])

    // right
    context.lineTo(endX, endY - innerBorderRadius[2])
    context.arcTo(endX, endY, endX - innerBorderRadius[2], endY, innerBorderRadius[2])

    // bottom
    context.lineTo(startX + innerBorderRadius[3], endY)
    context.arcTo(startX, endY, startX, endY - innerBorderRadius[3], innerBorderRadius[3])

    // left
    context.lineTo(startX, startY + innerBorderRadius[0])
    context.arcTo(startX, startY, startX + innerBorderRadius[0], startY, innerBorderRadius[0])

    context.stroke();

    return this
  }

  fill(color: string) {
    const { context } = this

    context.fillStyle = color
    context.fill()

    return this
  }

  drawImage(props: IImageProps): Promise<void> {
    const { context } = this
    const {
      dx, dy, dw, dh, url,
    } = props

    return new Promise((res) => {
      const image = new Image()

      image.src = url;
      image.onload = () => {
        context.drawImage(image, dx, dy, dw, dh)
        res()
      }
    })
  }

  drawRoundImage(props: IRoundImage): Promise<void> {
    const { context } = this
    const {
      url, rect, dw, dh, dx, dy,
    } = props;

    context.save()

    this.roundRect({
      ...rect,
      position: {
        startX: dx,
        startY: dy,
        width: dw,
        height: dh,
      },
    })

    return new Promise((res) => {
      const image = new Image()

      image.src = url;
      image.onload = () => {
        context.clip();
        context.drawImage(image, dx, dy, dw, dh)
        context.restore()
        res()
      }
    })
  }

  drawText(props: ITextProps) {
    const {
      startX,
      startY,
      text,
      font,
      fontKerning,
      textBaseline,
      direction,
      textAlign,
      color = "#000",
      isStroke,
    } = props

    const { ctx } = this;
    ctx.font = font || "18px";
    ctx.fontKerning = fontKerning || 'normal';
    ctx.textBaseline = textBaseline || 'middle';
    ctx.textAlign = textAlign || "left"
    ctx.direction = direction || "inherit";

    if (isStroke) {
      ctx.strokeStyle = color;
      ctx.strokeText(text, startX, startY)
      return this
    }

    ctx.fillStyle = color;
    ctx.fillText(text, startX, startY)

    return this
  }

  drawMultiTexts(props: IMultiTextProps) {
    const {
      text, startX, startY, gap = 10, maxWidth, maxHeight, ...res
    } = props
    const { ctx } = this

    if (ctx.measureText(text).width <= maxWidth) {
      // 一行写的下直接写
      this.drawText({
        text,
        startX,
        startY,
        ...res,
      })
    } else {
      let lineText = '';
      let lines = 0
      const fontSize = +((res.font || '').match(/(\d+)px/i)?.[1] ?? 18)

      ctx.font = res.font!

      for (let i = 0; i < text.length; i++) {
        lineText += text[i];

        if (ctx.measureText(lineText).width > maxWidth) {
          let paintText = lineText.slice(0, lineText.length - 1)
          let isEnd = false;

          // 下一行绘制的高度已经超过最大高度了
          // 那本行就需要展示...
          if (maxHeight && startY + ((lines + 1) * fontSize + gap) > maxHeight) {
            paintText = `${lineText.slice(0, lineText.length - 2)}...`;
            isEnd = true
          }

          this.drawText({
            text: paintText,
            startX,
            startY: startY + lines * (fontSize + gap),
            ...res,
          })

          if (isEnd) {
            break;
          }

          lines += 1;
          lineText = lineText[lineText.length - 1];
        }
      }
    }

    return this
  }
}

export default Paint
