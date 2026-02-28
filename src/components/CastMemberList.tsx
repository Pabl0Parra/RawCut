import React from 'react';
import { PersonList } from './PersonList';

interface CastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
}

interface CastMemberListProps {
    cast: CastMember[];
    title?: string;
}

export const CastMemberList: React.FC<CastMemberListProps> = ({ cast, title = "Reparto" }) => (
    <PersonList
        items={cast.map((m) => ({ ...m, subtitle: m.character }))}
        title={title}
        keyPrefix="cast"
    />
);