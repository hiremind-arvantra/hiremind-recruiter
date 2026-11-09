/* Static copy for the profile-submission screen. */
import { BriefcaseIcon, EyeIcon, BellIcon, SliderIcon, GiftIcon } from "./icons";

export const NEXT_STEPS = [
  {
    icon: <BriefcaseIcon />,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-600",
    title: "Explore Jobs",
    desc: "Find jobs that match your skills and preferences.",
    href: "/jobs",
  },
  {
    icon: <EyeIcon />,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    title: "Improve Visibility",
    desc: "Add a profile video or portfolio to stand out.",
    href: "/profile/edit",
  },
  {
    icon: <BellIcon />,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    title: "Set Job Alerts",
    desc: "Get notified about relevant job opportunities.",
    href: "/settings/notifications",
  },
  {
    icon: <SliderIcon />,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-600",
    title: "Update Preferences",
    desc: "Fine-tune your preferences anytime.",
    href: "/settings",
  },
  {
    icon: <GiftIcon />,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-500",
    title: "Invite & Earn",
    desc: "Invite your friends and earn exciting rewards.",
    href: "/referral",
  },
];

export const ENHANCEMENTS = [
  {
    icon: "🎬",
    color: "text-brand-600",
    iconBg: "bg-brand-50",
    title: "Add Profile Video",
    desc: "Introduce yourself to recruiters with a short video.",
    cta: "Add Video",
    ctaStyle: "border-brand-400 text-brand-600 hover:bg-brand-50",
  },
  {
    icon: "📋",
    color: "text-green-600",
    iconBg: "bg-green-50",
    title: "Add Portfolio",
    desc: "Showcase your work and projects to build credibility.",
    cta: "Add Portfolio",
    ctaStyle: "border-green-400 text-green-600 hover:bg-green-50",
  },
  {
    icon: "📄",
    color: "text-orange-500",
    iconBg: "bg-orange-50",
    title: "Upload Resume",
    desc: "Let recruiters download your resume in one click.",
    cta: "Upload Resume",
    ctaStyle: "border-orange-400 text-orange-500 hover:bg-orange-50",
  },
  {
    icon: "👥",
    color: "text-brand-600",
    iconBg: "bg-brand-50",
    title: "Get Endorsed",
    desc: "Get skill endorsements from your colleagues.",
    cta: "Request Endorsements",
    ctaStyle: "border-brand-400 text-brand-600 hover:bg-brand-50",
  },
];
