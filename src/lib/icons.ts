import type { Component } from 'vue'
import {
  BookOpen, Code2, Feather, Heart, Mail, Rss, Send, Link as LinkIcon, Coffee,
} from '@lucide/vue'
import BrandGithub from '@/components/BrandGithub.vue'

/** Icons that are safe to reference by name from the persisted site config. */
export const iconMap: Record<string, Component> = {
  github: BrandGithub,
  mail: Mail,
  rss: Rss,
  book: BookOpen,
  code: Code2,
  feather: Feather,
  heart: Heart,
  send: Send,
  link: LinkIcon,
  coffee: Coffee,
}

export function resolveIcon(name: string): Component {
  return iconMap[name] || LinkIcon
}
