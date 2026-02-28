import React from 'react';
import { PersonList } from './PersonList';

interface CrewMember {
    id: number;
    name: string;
    job: string;
    profile_path: string | null;
}

interface CrewMemberListProps {
    crew: CrewMember[];
    title: string;
}

export const CrewMemberList: React.FC<CrewMemberListProps> = ({ crew, title }) => (
    <PersonList
        items={crew.map((m) => ({ ...m, subtitle: m.job }))}
        title={title}
        keyPrefix="crew"
    />
);