// Demo content for a fresh deployment (npx convex run seed:seed). Everything
// here is fictitious — a made-up association, people and partners — so the
// repository never carries a real instance's data. Images are Unsplash URLs
// and generated placeholders; a real instance replaces all of it from the admin.
export const INITIAL_SPONSOR_TIERS = [
    { name: 'Visionário (Platina)', price: '500€ / ano', order: 1, benefits: ['Logótipo em destaque na Homepage', 'Placa de Agradecimento na sede', 'Menção em todos os eventos', '4 Entradas Livres', 'Post exclusivo nas redes sociais'] },
    { name: 'Benemérito (Ouro)', price: '250€ / ano', order: 2, benefits: ['Logótipo na secção de parceiros', 'Menção nas redes sociais', 'Certificado de Parceiro', '2 Entradas Livres'] },
    { name: 'Apoiante (Prata)', price: '100€ / ano', order: 3, benefits: ['Logótipo na página de Parceiros', 'Menção no relatório anual'] },
    { name: 'Institucional', price: 'Apoio Logístico', order: 4, benefits: ['Parceria estratégica', 'Co-organização de eventos'] }
];

export const INITIAL_CATEGORIES = [
    { id: 1, name: "Institucional", slug: "institucional", color: "bg-slate-500", createdAt: new Date().toISOString() },
    { id: 2, name: "Eventos", slug: "eventos", color: "bg-brand-500", createdAt: new Date().toISOString() },
    { id: 3, name: "Desporto", slug: "desporto", color: "bg-green-500", createdAt: new Date().toISOString() },
    { id: 4, name: "Solidariedade", slug: "solidariedade", color: "bg-pink-500", createdAt: new Date().toISOString() },
    { id: 5, name: "Cultura", slug: "cultura", color: "bg-purple-500", createdAt: new Date().toISOString() },
    { id: 6, name: "Lazer", slug: "lazer", color: "bg-orange-500", createdAt: new Date().toISOString() },
    { id: 7, name: "Formação", slug: "formacao", color: "bg-yellow-500", createdAt: new Date().toISOString() }
];

// Fictitious partners; logos are generated placeholders (seed fills them in)
export const INITIAL_SPONSORS = [
    { id: 1, name: "Câmara Municipal de Vila Nova", logoUrl: "", tier: "institutional", active: true, website: "https://example.org" },
    { id: 2, name: "Junta de Freguesia de Vila Nova", logoUrl: "", tier: "institutional", active: true, website: "https://example.org" },
    { id: 3, name: "Pedreiras do Vale, Lda.", logoUrl: "", tier: "gold", active: true, website: "https://example.org" },
    { id: 4, name: "Tecnologia & Sistemas", logoUrl: "", tier: "gold", active: true, website: "https://example.org" },
];

const IMG = {
    walk: "https://images.unsplash.com/photo-1512413914633-b5043f4041ea?q=80&w=2000&auto=format&fit=crop",
    cards: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=2000&auto=format&fit=crop",
    snooker: "https://images.unsplash.com/photo-1575224300306-1b8da36134ec?q=80&w=2000&auto=format&fit=crop",
    craft: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop",
    outdoor: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2000&auto=format&fit=crop",
    festival: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2000&auto=format&fit=crop",
    futsal: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2000&auto=format&fit=crop",
    dance: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?q=80&w=2000&auto=format&fit=crop",
    fado: "https://images.unsplash.com/photo-1516981879613-9f5da904015f?q=80&w=2000&auto=format&fit=crop",
    works: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2000&auto=format&fit=crop",
    meeting: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2000&auto=format&fit=crop",
    party: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2000&auto=format&fit=crop",
    hands: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2000&auto=format&fit=crop",
    gallery1: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2000&auto=format&fit=crop",
    gallery2: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2000&auto=format&fit=crop",
    gallery3: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2000&auto=format&fit=crop",
    gallery4: "https://images.unsplash.com/photo-1577083288073-40892c0860a4?q=80&w=2000&auto=format&fit=crop",
};

const NOW = "2026-01-01T10:00:00";

export const INITIAL_EVENTS = [
    { id: 1, title: "Caminhada de Natal", slug: "caminhada-natal", description: "Caminhada solidária para recolha de bens alimentares. Percurso de cerca de 8 km com grau de dificuldade baixo, aberto a toda a família.", date: "2025-12-21T09:00:00", location: "Ponto de encontro: sede da associação", imageUrl: IMG.walk, categoryId: 3, category: "Desporto", isHighlight: true, createdAt: NOW, updatedAt: NOW, isTournament: false, registrationOpen: true, status: 'published' },
    { id: 2, title: "Torneio de Sueca de Ano Novo", slug: "torneio-sueca-ano-novo", description: "O tradicional torneio de Sueca abre o ano. Reúna a sua dupla e venha disputar os prémios para os três primeiros classificados.", date: "2026-01-11T15:00:00", location: "Bar da Associação", imageUrl: IMG.cards, categoryId: 6, category: "Lazer", isHighlight: true, createdAt: NOW, updatedAt: NOW, isTournament: true, tournamentType: 'Sueca', registrationOpen: true, maxParticipants: 40, status: 'published' },
    { id: 3, title: "Torneio de Snooker", slug: "torneio-snooker", description: "Competição aberta na sala de jogos renovada. Inscrições limitadas a 32 jogadores.", date: "2026-02-15T20:00:00", location: "Sala de Jogos", imageUrl: IMG.snooker, categoryId: 3, category: "Desporto", isHighlight: false, createdAt: NOW, updatedAt: NOW, isTournament: true, tournamentType: 'Snooker', registrationOpen: true, maxParticipants: 32, status: 'published' },
    { id: 4, title: "Workshop: Artesanato Local", slug: "workshop-artesanato", description: "Técnicas tradicionais de tecelagem e cestaria com artesãos da região. Material incluído.", date: "2026-03-22T15:00:00", location: "Sala de Convívio", imageUrl: IMG.craft, categoryId: 5, category: "Cultura", isHighlight: false, createdAt: NOW, updatedAt: NOW, isTournament: false, registrationOpen: true, status: 'published' },
    { id: 5, title: "Torneio de Malha de Primavera", slug: "torneio-malha-primavera", description: "Mantendo viva a tradição: o jogo da malha regressa ao recinto exterior num dia de sol, petiscos e boa disposição.", date: "2026-05-17T14:00:00", location: "Recinto Exterior", imageUrl: IMG.outdoor, categoryId: 5, category: "Cultura", isHighlight: false, createdAt: NOW, updatedAt: NOW, isTournament: true, tournamentType: 'Chinquilho', registrationOpen: true, maxParticipants: 32, status: 'published' },
    { id: 6, title: "Festa de Verão", slug: "festa-verao", description: "A grande festa anual: três dias de música, gastronomia e animação, o ponto alto do ano para a comunidade.", date: "2026-07-15T19:00:00", location: "Largo da Sede", imageUrl: IMG.festival, categoryId: 2, category: "Eventos", isHighlight: true, createdAt: NOW, updatedAt: NOW, isTournament: false, registrationOpen: false, status: 'published' },
    { id: 7, title: "Torneio de Futsal 24 Horas", slug: "torneio-futsal-24h", description: "Um dos eventos mais vibrantes do ano: 24 horas de futsal no pavilhão, com equipas de toda a região.", date: "2026-09-05T10:00:00", location: "Pavilhão Gimnodesportivo", imageUrl: IMG.futsal, categoryId: 3, category: "Desporto", isHighlight: true, createdAt: NOW, updatedAt: NOW, isTournament: true, tournamentType: 'Futsal', registrationOpen: true, maxParticipants: 16, status: 'published' },
    { id: 8, title: "Magusto Comunitário", slug: "magusto", description: "Castanhas, jeropiga e água-pé por conta da casa. Recordações do último magusto.", date: "2025-11-11T17:00:00", location: "Exterior da Sede", imageUrl: IMG.snooker, categoryId: 2, category: "Eventos", isHighlight: false, createdAt: NOW, updatedAt: NOW, isTournament: false, registrationOpen: false, status: 'published' },
    { id: 9, title: "Aulas de Zumba", slug: "zumba", description: "Aulas semanais para todas as idades. Energia, música e movimento.", date: "2026-02-05T19:00:00", location: "Sala de Espelhos", imageUrl: IMG.dance, categoryId: 3, category: "Desporto", isHighlight: false, createdAt: NOW, updatedAt: NOW, isTournament: false, registrationOpen: true, status: 'published' },
    { id: 10, title: "Noite de Fados e Petiscos", slug: "noite-fados", description: "Uma noite dedicada à alma portuguesa, com fadistas convidados e o melhor da gastronomia regional.", date: "2026-04-18T20:30:00", location: "Salão Principal", imageUrl: IMG.fado, categoryId: 5, category: "Cultura", isHighlight: true, createdAt: NOW, updatedAt: NOW, isTournament: false, registrationOpen: true, status: 'published' },
    { id: 11, title: "Torneio Amigável de Petanca", slug: "torneio-petanca", description: "Torneio amigável no campo de jogos da associação, aberto a federados e curiosos, com convívio ao longo do dia.", date: "2026-07-12T09:00:00", location: "Campo de Petanca", imageUrl: IMG.outdoor, categoryId: 3, category: "Desporto", isHighlight: true, createdAt: NOW, updatedAt: NOW, isTournament: true, tournamentType: 'Petanca', registrationOpen: true, maxParticipants: 32, status: 'published' },
    { id: 12, title: "Caminhada Mensal", slug: "caminhada-mensal", description: "No primeiro domingo de cada mês, uma caminhada pela natureza da região, antecedida de aquecimento. Aberta a sócios e à população.", date: "2026-08-02T08:30:00", location: "Partida da sede", imageUrl: IMG.walk, categoryId: 3, category: "Desporto", isHighlight: true, createdAt: NOW, updatedAt: NOW, isTournament: false, registrationOpen: false, status: 'published' },
];

export const INITIAL_REGISTRATIONS = [
    { id: "reg_1", eventId: 2, name: "Manuel Silva", email: "manuel@email.com", status: "confirmed", timestamp: new Date("2025-11-20T10:00:00").getTime() },
    { id: "reg_2", eventId: 2, name: "Carlos Sousa", email: "carlos@email.com", status: "pending", timestamp: new Date("2025-11-25T14:30:00").getTime() }
];

export const INITIAL_POSTS = [
    { id: 1, title: "Obras de Melhoria na Sede Concluídas", slug: "obras-sede", excerpt: "Anunciamos a conclusão da renovação dos balneários e da iluminação LED do recinto desportivo.", content: `<p class="mb-4 text-lg">A associação investiu na modernização das suas infraestruturas para melhor servir os sócios e atletas.</p>`, coverUrl: IMG.works, categoryId: 1, category: "Institucional", published: true, date: "2025-12-01T09:00:00", author: "Direção" },
    { id: 2, title: "Desenvolvimento Recreativo e Apoio à Comunidade", slug: "desenvolvimento-recreativo", excerpt: "Reafirmamos o compromisso de apoiar o desenvolvimento recreativo da região, disponibilizando novos meios e espaços.", content: `<p class="mb-4 text-lg">Esta associação atua, essencialmente, na área recreativa, cultural e desportiva.</p>`, coverUrl: IMG.meeting, categoryId: 1, category: "Institucional", published: true, date: "2025-11-15T09:00:00", author: "Direção" },
    { id: 3, title: "Sucesso no Torneio de Sueca", slug: "resumo-sueca", excerpt: "Mais de 30 duplas participaram na última edição do torneio, que encheu a sala de convívio de animação.", content: `<p>Foi uma tarde memorável. Parabéns à dupla vencedora.</p>`, coverUrl: IMG.party, categoryId: 6, category: "Lazer", published: true, date: "2025-10-30T09:00:00", author: "Direção" },
    { id: 4, title: "Solidariedade Social", slug: "solidariedade", excerpt: "Apoiamos a solidariedade social através da angariação de fundos e de eventos com conotação social.", content: `<p>A nossa missão vai além do desporto e da cultura.</p>`, coverUrl: IMG.hands, categoryId: 4, category: "Solidariedade", published: true, date: "2025-10-12T18:00:00", author: "Direção" }
];

// Fictitious governing bodies; photos are generated placeholders
export const INITIAL_MEMBERS = [
    { id: 1, name: "Maria Antunes Ferreira", role: "Presidente", group: "Assembleia Geral", order: 1, photoUrl: "" },
    { id: 2, name: "Rui Costa Lopes", role: "Secretário", group: "Assembleia Geral", order: 2, photoUrl: "" },
    { id: 3, name: "Inês Ramos Pereira", role: "Secretária", group: "Assembleia Geral", order: 3, photoUrl: "" },
    { id: 4, name: "Ana Sofia Martins", role: "Presidente", group: "Direção", order: 1, photoUrl: "" },
    { id: 5, name: "Tiago Neves Carvalho", role: "Secretário", group: "Direção", order: 2, photoUrl: "" },
    { id: 6, name: "Helena Dias Moreira", role: "Tesoureira", group: "Direção", order: 3, photoUrl: "" },
    { id: 7, name: "Pedro Almeida Santos", role: "Vogal", group: "Direção", order: 4, photoUrl: "" },
    { id: 8, name: "Sara Fonseca Ribeiro", role: "Vogal", group: "Direção", order: 5, photoUrl: "" },
    { id: 9, name: "Luís Baptista Cunha", role: "Presidente", group: "Conselho Fiscal", order: 1, photoUrl: "" },
    { id: 10, name: "Cláudia Nunes Teixeira", role: "Secretária", group: "Conselho Fiscal", order: 2, photoUrl: "" },
    { id: 11, name: "Miguel Correia Pinto", role: "Vogal", group: "Conselho Fiscal", order: 3, photoUrl: "" },
    // Founders feed the "Sócios Fundadores" section of the History page
    { id: 12, name: "António Simões Rocha", role: "Sócio Fundador", group: "founder", order: 1, photoUrl: "" },
    { id: 13, name: "Joaquim Bento Alves", role: "Sócio Fundador", group: "founder", order: 2, photoUrl: "" },
    { id: 14, name: "Francisco Marques Leal", role: "Sócio Fundador", group: "founder", order: 3, photoUrl: "" },
    { id: 15, name: "Manuel Reis Duarte", role: "Sócio Fundador", group: "founder", order: 4, photoUrl: "" },
];

export const INITIAL_NOTIFICATIONS = [
    { title: "Assembleia Geral", message: "Convocatória para Assembleia Geral Extraordinária no dia 20 de novembro.", type: 'Urgent', target: 'all' },
    { title: "Quotas", message: "O pagamento de quotas para o novo ano já se encontra disponível.", type: 'Info', target: 'all' },
];

export const INITIAL_ALBUMS = [
    { title: "Festas e Convívios", date: "2025-08-01", coverUrl: IMG.festival, photos: [IMG.festival, IMG.party, IMG.fado, IMG.gallery1] },
    { title: "Torneios e Desporto", date: "2025-06-01", coverUrl: IMG.futsal, photos: [IMG.futsal, IMG.snooker, IMG.outdoor, IMG.gallery2] },
    { title: "A Nossa Sede", date: "2024-10-01", coverUrl: IMG.gallery3, photos: [IMG.gallery3, IMG.gallery4, IMG.works] },
];

export const INITIAL_ACTION_AREAS = [
    { title: "Recreativo", subtitle: "Lazer & Comunidade", description: "Combatemos o isolamento social através da criação de espaços e momentos de convívio.", longDescription: "A vertente recreativa é o coração pulsante da associação. Uma comunidade forte constrói-se através de laços humanos sólidos.", features: ["Gestão do Bar Associativo", "Sala de Jogos", "Jantares de Convívio"], externalImage: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1000", iconName: "Users", order: 1 },
    { title: "Cultural", subtitle: "Identidade & Evolução", description: "Apoiamos a divulgação e evolução do património cultural local.", longDescription: "A cultura é a memória de um povo. Preservamos as tradições da nossa terra e abrimos espaço a novas expressões.", features: ["Workshops Criativos", "Noites de Fado", "Preservação de Tradições"], externalImage: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000", iconName: "Lightbulb", order: 2 },
    { title: "Desportivo", subtitle: "Saúde & Competição", description: "Dispomos de infraestruturas para potenciar o desenvolvimento desportivo.", longDescription: "Com o nosso pavilhão, somos uma referência desportiva na região.", features: ["Pavilhão Polivalente", "Torneios Anuais", "Ginástica Sénior"], externalImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000", iconName: "Target", order: 3 },
    { title: "Solidariedade", subtitle: "Apoio Social Ativo", description: "A responsabilidade social é o nosso norte. Apoiamos a solidariedade local.", longDescription: "Não deixamos ninguém para trás. Trabalhamos em rede para garantir uma resposta digna.", features: ["Recolha de Alimentos", "Eventos de Angariação", "Apoio Logístico"], externalImage: "https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=1000", iconName: "Heart", order: 4 }
];

export const INITIAL_STATS = [
    { label: "Fundação", value: "1985", order: 1 },
    { label: "Sócios Ativos", value: "120+", order: 2 },
    { label: "Eventos por ano", value: "30+", order: 3 },
    { label: "Voluntários", value: "100%", order: 4 }
];

export const INITIAL_DOCUMENTS = [
    { title: "Estatutos da Associação", category: 'Estatutos', url: "#", date: "2020-01-01", size: "2.4 MB" },
    { title: "Relatório de Contas", category: 'Relatórios', url: "#", date: "2025-03-15", size: "1.1 MB" },
    { title: "Regulamento Interno", category: 'Regulamentos', url: "#", date: "2022-06-10", size: "0.8 MB" }
];
