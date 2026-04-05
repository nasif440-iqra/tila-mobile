import { Text, type TextProps, type TextStyle } from "react-native";
import { typography } from "../tokens";
import { useColors } from "../theme";

type ArabicSize = "display" | "quizHero" | "quizOption" | "large" | "body";

interface ArabicTextProps extends Omit<TextProps, "style"> {
  size?: ArabicSize;
  color?: string;
  style?: TextStyle;
  children: React.ReactNode;
}

const SIZE_MAP: Record<ArabicSize, { fontFamily: string; fontSize: number; lineHeight: number }> = {
  display: typography.arabicDisplay,
  quizHero: typography.arabicQuizHero,
  quizOption: typography.arabicQuizHero,
  large: typography.arabicLarge,
  body: typography.arabicBody,
};

export function ArabicText({
  size = "large",
  color,
  style,
  children,
  ...rest
}: ArabicTextProps) {
  const colors = useColors();

  return (
    <Text
      {...rest}
      style={[
        sizeStyle(size),
        {
          color: color ?? colors.text,
          writingDirection: "rtl",
          textAlign: "center",
          overflow: "visible" as const,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

function sizeStyle(size: ArabicSize) {
  return SIZE_MAP[size];
}
