import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '開始您的旅程 | FitScience',
    description: '設定您的個人檔案與目標',
};

export default function OnboardingPage() {
    return <OnboardingWizard />;
}
