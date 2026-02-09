import React from 'react';
import { 
  Atom, Beaker, Dna, Stethoscope, Laptop, 
  Calculator, Users, Brain, TrendingUp, Leaf, Wrench, MoreHorizontal 
} from 'lucide-react';

const icons = {
  "Physique": Atom,
  "Chimie": Beaker,
  "Biologie": Dna,
  "Médecine": Stethoscope,
  "Informatique": Laptop,
  "Mathématiques": Calculator,
  "Sciences sociales": Users,
  "Psychologie": Brain,
  "Économie": TrendingUp,
  "Environnement": Leaf,
  "Ingénierie": Wrench,
  "Autre": MoreHorizontal
};

const DomainFilter = ({ selectedDomain, onSelectDomain }) => {
  const domains = ["Tous", ...Object.keys(icons)];

  return (
    <div className="flex flex-wrap gap-2 py-4">
      {domains.map((domain) => {
        const Icon = icons[domain];
        const isSelected = selectedDomain === domain;
        
        return (
          <button
            key={domain}
            onClick={() => onSelectDomain(domain)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${isSelected 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `}
          >
            {Icon && <Icon size={16} />}
            {domain}
          </button>
        );
      })}
    </div>
  );
};

export default DomainFilter;