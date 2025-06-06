import React from 'react';

const OnyxTemplate = ({ info, sections, sectionOrder }) => {
  // A simple template structure
  return (
    <div className="p-8 bg-white text-black font-sans text-sm w-[210mm] h-[297mm]">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold">{info.fullName}</h1>
        <p className="text-lg">{info.jobTitle}</p>
      </header>
      <main>
        {sectionOrder.map(key => {
          if (!sections[key] || sections[key].length === 0) return null;
          return (
            <section key={key} className="mb-6">
              <h2 className="text-xl font-bold border-b-2 border-black mb-2 uppercase">{key}</h2>
              {sections[key].map((item, index) => (
                <div key={index} className="mb-2">
                  <p><strong>{item.title || item.name}</strong></p>
                  <p>{item.description}</p>
                </div>
              ))}
            </section>
          );
        })}
      </main>
    </div>
  );
};

export default OnyxTemplate; 