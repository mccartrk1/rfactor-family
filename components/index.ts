// components/index.ts — single import point for all components

// Tokens
export * from './tokens'

// UI
export { Button }                      from './ui/Button'
export { Badge }                       from './ui/Badge'
export { Input, TextArea }             from './ui/Input'
export { ProgressDots }                from './ui/ProgressDots'
export { Collapsible }                 from './ui/Collapsible'
export { StatCard }                    from './ui/StatCard'
export { EmptyState }                  from './ui/EmptyState'
export { ToastProvider, useToast }     from './ui/Toast'
export {
  LoadingDots,
  PulsingEmoji,
  LoadingScreen,
}                                      from './ui/LoadingDots'

// Lesson
export { QuizOption, QuizGroup, OrSeparator } from './lesson/QuizOption'
export { ChoiceCard, ChoiceGroup }            from './lesson/ChoiceCard'
export { WeekCard }                           from './lesson/WeekCard'

// Types
export type { ButtonProps, ButtonVariant, ButtonSize }    from './ui/Button'
export type { BadgeProps, BadgeVariant }                  from './ui/Badge'
export type { InputProps, TextAreaProps }                  from './ui/Input'
export type { ProgressDotsProps }                         from './ui/ProgressDots'
export type { CollapsibleProps }                          from './ui/Collapsible'
export type { StatCardProps }                             from './ui/StatCard'
export type { EmptyStateProps }                           from './ui/EmptyState'
export type { ToastAPI, ToastVariant }                    from './ui/Toast'
export type { LoadingDotsProps }                          from './ui/LoadingDots'
export type { QuizOptionProps, QuizOptionState, QuizGroupProps } from './lesson/QuizOption'
export type { ChoiceCardProps, ChoiceGroupProps, ChoiceVariant } from './lesson/ChoiceCard'
export type { WeekCardProps, WeekStatus }                 from './lesson/WeekCard'
