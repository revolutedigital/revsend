import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-lg border bg-card text-card-foreground shadow-sm", {
  variants: {
    size: {
      sm: "",
      default: "",
      lg: "",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const cardHeaderVariants = cva("flex flex-col space-y-1.5", {
  variants: {
    size: {
      sm: "p-4",
      default: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const cardContentVariants = cva("pt-0", {
  variants: {
    size: {
      sm: "p-4",
      default: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ size }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ size }), className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, size, ...props }, ref) => (
    <div ref={ref} className={cn(cardContentVariants({ size }), className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
