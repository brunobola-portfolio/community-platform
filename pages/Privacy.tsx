import React from 'react';
import { useData } from '../context/DataContext';

const SECTION = 'space-y-3';
const H2 = 'font-serif text-2xl text-slate-900 dark:text-white';

/**
 * The information art. 13 GDPR asks for, written from the association's
 * settings so every instance names itself as controller. Retention periods are
 * the ones the platform enforces (convex/registrations.ts, crons.ts), so the
 * page cannot promise something the code does not do.
 */
export const PrivacyPage: React.FC = () => {
    const { settings } = useData();
    const controller = settings.siteFullName || settings.siteName;
    const contact = settings.contactEmail;

    return (
        <div className="min-h-screen bg-slate-50 pb-24 pt-32 dark:bg-dark-bg">
            <title>{`Privacidade — ${settings.siteName}`}</title>
            <article className="mx-auto max-w-3xl space-y-10 px-4 text-slate-700 dark:text-slate-300 sm:px-6">
                <header className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-400">Aviso de privacidade</p>
                    <h1 className="font-serif text-4xl text-slate-900 dark:text-white md:text-5xl">Como tratamos os seus dados</h1>
                    <p className="text-lg">Em linguagem simples: o que recolhemos neste site, para quê, durante quanto tempo e como pode pedir para ver ou apagar.</p>
                </header>

                <section className={SECTION}>
                    <h2 className={H2}>Quem é responsável</h2>
                    <p><b>{controller}</b>{settings.address ? `, ${settings.address}` : ''}. Para qualquer questão sobre os seus dados{contact ? <>: <b className="break-all">{contact}</b></> : ', use o formulário de contacto do site'}.</p>
                </section>

                <section className={SECTION}>
                    <h2 className={H2}>O que recolhemos e porquê</h2>
                    <ul className="list-disc space-y-2 pl-5">
                        <li><b>Inscrições em eventos</b> — nome, email, telemóvel (se o indicar) e as respostas que o evento pedir. Servem só para gerir essa inscrição: confirmar o lugar, organizar o evento e contactá-lo sobre ele. É o tratamento necessário para dar seguimento ao pedido que fez (art. 6.º, n.º 1, al. b) do RGPD).</li>
                        <li><b>Conta de sócio</b> — email e nome, para a área reservada, quotas e documentos da associação.</li>
                        <li><b>Mensagens de contacto e pedidos de parceria</b> — o que escrever, para lhe responder.</li>
                        <li><b>Assistente virtual</b> — as perguntas que fizer são enviadas a um serviço de inteligência artificial para obter a resposta e não são associadas ao seu nome.</li>
                    </ul>
                    <p>Não vendemos dados, não os usamos para publicidade e não enviamos newsletters sem autorização.</p>
                </section>

                <section className={SECTION}>
                    <h2 className={H2}>Durante quanto tempo</h2>
                    <ul className="list-disc space-y-2 pl-5">
                        <li>Inscrições feitas sem conta: apagadas automaticamente <b>90 dias depois do evento</b>; as canceladas, ao fim de 30 dias.</li>
                        <li>Inscrições de sócios com conta: enquanto a conta existir.</li>
                        <li>Contas de sócio: até pedir que sejam apagadas.</li>
                    </ul>
                </section>

                <section className={SECTION}>
                    <h2 className={H2}>Quem mais trata os dados</h2>
                    <p>Serviços que usamos para o site funcionar, sob contrato e com as garantias do RGPD:</p>
                    <ul className="list-disc space-y-2 pl-5">
                        <li><b>Convex</b> — base de dados e alojamento do site (Estados Unidos, com cláusulas contratuais-tipo aprovadas pela Comissão Europeia).</li>
                        <li><b>Google</b> — serviço de inteligência artificial do assistente virtual.</li>
                        <li><b>Sentry</b> — registo técnico de erros do site, sem nome nem email de quem o usa.</li>
                    </ul>
                </section>

                <section className={SECTION}>
                    <h2 className={H2}>Os seus direitos</h2>
                    <p>Pode pedir para ver, corrigir ou apagar os seus dados, ou opor-se a um tratamento{contact ? <>, escrevendo para <b className="break-all">{contact}</b></> : ''}. Respondemos no prazo de um mês. Se achar que os seus dados não foram bem tratados, pode apresentar reclamação à Comissão Nacional de Proteção de Dados (<a className="text-brand-700 underline underline-offset-4 dark:text-brand-400" href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">cnpd.pt</a>).</p>
                </section>

                <section className={SECTION}>
                    <h2 className={H2}>No seu browser</h2>
                    <p>Não usamos cookies de publicidade nem de estatística. O site guarda no seu browser a preferência de tema (claro ou escuro), a sessão de quem entra com conta e um identificador aleatório que serve apenas para travar abusos nos formulários e no assistente — não identifica a pessoa.</p>
                </section>
            </article>
        </div>
    );
};
