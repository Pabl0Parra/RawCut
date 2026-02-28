import React from 'react';
import LegalScreen from '../src/components/LegalScreen';

export default function TermsOfServiceScreen(): React.JSX.Element {
    return <LegalScreen namespace="terms" sectionCount={5} />;
}