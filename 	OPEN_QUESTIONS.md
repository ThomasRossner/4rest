# Offene Fragen zur Klärung mit dem Kunden

Dieses Dokument listet Fragen auf, die beantwortet werden müssen, um eine genaue Implementierung der Roots of Impact Plattform sicherzustellen.

## Fragenübersicht

| Frage ID | Kategorie | Unterkategorie | Frage | Details/Optionen |
|----------|-----------|----------------|-------|------------------|
| Q1.1 | 1. Authentifizierung & Benutzerverwaltung | Benutzerregistrierung | Wie sollen sich Benutzer zunächst registrieren? | • Selbstregistrierung per E-Mail/Passwort<br>• Einladungssystem<br>• Integration mit bestehendem Hotel-Gästeverwaltungssystem |
| Q1.2 | 1. Authentifizierung & Benutzerverwaltung | Benutzerregistrierung | Müssen Gäste eine Buchungsbestätigung oder Zimmernummer angeben, um zu verifizieren, dass sie Hotelgäste sind? | |
| Q1.3 | 1. Authentifizierung & Benutzerverwaltung | Benutzerregistrierung | Wie werden Mitarbeiter identifiziert und zum System hinzugefügt? | • Manuelles Hinzufügen durch Admin<br>• Automatische Synchronisation von HotelKit<br>• Selbstregistrierung von Mitarbeitern mit Verifizierung |
| Q1.4 | 1. Authentifizierung & Benutzerverwaltung | Social Login | Welche Social-Login-Anbieter sollen unterstützt werden? | Google, Facebook, Apple, etc. |
| Q1.5 | 1. Authentifizierung & Benutzerverwaltung | Social Login | Ist Social Login obligatorisch oder optional neben E-Mail/Passwort? | |
| Q1.6 | 1. Authentifizierung & Benutzerverwaltung | Rollenverwaltung | Können Benutzer mehrere Rollen haben? | z.B. ein Gast, der auch Stakeholder wird |
| Q1.7 | 1. Authentifizierung & Benutzerverwaltung | Rollenverwaltung | Wie sollen Stakeholder-Konten erstellt werden? Ist eine Verifizierung erforderlich? | |
| Q2.1 | 2. Video-Inhalte & Hosting | Videoproduktion | Wer wird die Video-Inhalte erstellen? | • Hotel-Personal<br>• Externe Agentur (Beyond Content GmbH erwähnt)<br>• Mischung aus beidem |
| Q2.2 | 2. Video-Inhalte & Hosting | Videoproduktion | Was ist das erwartete Volumen an Videos? | Anzahl der Videos, gesamter Speicherbedarf |
| Q2.3 | 2. Video-Inhalte & Hosting | Video-Hosting | Wo sollen Videos gehostet werden? | • AWS S3 mit CloudFront<br>• Vimeo/Youtube-Einbettung<br>• Selbst gehostete Lösung |
| Q2.4 | 2. Video-Inhalte & Hosting | Video-Hosting | Was sind die Videoformat-Anforderungen? | Auflösung, Dauer-Limits, Dateigröße |
| Q2.5 | 2. Video-Inhalte & Hosting | Video-Hosting | Sollen Videos herunterladbar sein oder nur Streaming? | |
| Q2.6 | 2. Video-Inhalte & Hosting | Video-Inhaltsverwaltung | Wer genehmigt/verwaltet Video-Inhalte? Ist ein Admin-Panel erforderlich? | |
| Q2.7 | 2. Video-Inhalte & Hosting | Video-Inhaltsverwaltung | Sollen Videos Untertitel/Beschriftungen für Barrierefreiheit unterstützen? | |
| Q2.8 | 2. Video-Inhalte & Hosting | Video-Inhaltsverwaltung | Benötigen Videos mehrsprachige Versionen oder nur Deutsch? | |
| Q3.1 | 3. QR-Code-System | QR-Code-Generierung | Wie werden QR-Codes generiert und verteilt? | • Automatisch generiert pro Aufgabe<br>• Vorab gedruckte QR-Codes, die an physischen Standorten platziert werden<br>• Hybrid-Ansatz |
| Q3.2 | 3. QR-Code-System | QR-Code-Generierung | Sollen QR-Codes eindeutig pro Benutzer oder pro Aufgabe/Standort sein? | |
| Q3.3 | 3. QR-Code-System | QR-Code-Generierung | Was passiert, wenn ein QR-Code mehrfach vom gleichen Benutzer gescannt wird? | |
| Q3.4 | 3. QR-Code-System | QR-Code-Generierung | Wie sind QR-Codes vor Missbrauch geschützt? | Ablauf, einmalige Nutzung, etc. |
| Q3.5 | 3. QR-Code-System | QR-Code-Platzierung | Wo werden QR-Codes physisch im Hotel platziert? | • Rezeption, Zimmer, Spa, Restaurant<br>• Mehrere Standorte pro Aufgabentyp |
| Q3.6 | 3. QR-Code-System | QR-Code-Platzierung | Wie sollen QR-Codes gestaltet/gedruckt werden? | Größe, Stil, Branding |
| Q4.1 | 4. Belohnungen & Gutschein-System | Belohnungstypen | Welche spezifischen Arten von Belohnungen werden angeboten? | • Rabattprozentsätze? (z.B. 10% Rabatt auf Spa)<br>• Festbetrags-Gutscheine?<br>• Kostenlose Dienstleistungen/Produkte?<br>• Urlaubstage für Mitarbeiter?<br>• Team-Events? |
| Q4.2 | 4. Belohnungen & Gutschein-System | Belohnungstypen | Wie ist die Punkte-zu-Belohnung-Umrechnungsrate? | z.B. 100 Punkte = 5€ Rabatt |
| Q4.3 | 4. Belohnungen & Gutschein-System | Belohnungstypen | Sollte es verschiedene Belohnungsstufen basierend auf gesammelten Punkten geben? | |
| Q4.4 | 4. Belohnungen & Gutschein-System | Gutschein-Integration | Welche externen Gutschein-/Anbieter müssen integriert werden? | • Bestehendes POS-System des Hotels<br>• Drittanbieter-Gutschein-Plattformen<br>• Nur benutzerdefinierte Gutschein-Generierung |
| Q4.5 | 4. Belohnungen & Gutschein-System | Gutschein-Integration | Welche Gutschein-Informationen müssen erfasst werden? | Ablauf, Nutzung, Rückerstattungen? |
| Q4.6 | 4. Belohnungen & Gutschein-System | Gutschein-Integration | Wie sollen Gutscheine an Benutzer geliefert werden? | E-Mail, In-App-Anzeige, druckbar? |
| Q4.7 | 4. Belohnungen & Gutschein-System | Belohnungslimits | Gibt es Limits für die Belohnungseinlösung? | täglich, monatlich, pro Benutzer |
| Q4.8 | 4. Belohnungen & Gutschein-System | Belohnungslimits | Können Belohnungen zwischen Benutzern übertragen werden oder sind sie nicht übertragbar? | |
| Q5.1 | 5. HotelKit-Integration | API-Details | Was ist die genaue HotelKit-API-Dokumentation/Endpunkte, mit der wir uns integrieren müssen? | |
| Q5.2 | 5. HotelKit-Integration | API-Details | Welche Authentifizierungsmethode verwendet HotelKit? | API-Schlüssel, OAuth, etc. |
| Q5.3 | 5. HotelKit-Integration | API-Details | Was ist die HotelKit-Basis-URL und API-Version? | |
| Q5.4 | 5. HotelKit-Integration | API-Details | Welche HotelKit-Entitäten müssen synchronisiert werden? | Aufgaben, Mitarbeiter, Abschlüsse |
| Q5.5 | 5. HotelKit-Integration | Synchronisationsverhalten | Wie häufig sollte die HotelKit-Synchronisation erfolgen? | Echtzeit, stündlich, täglich |
| Q5.6 | 5. HotelKit-Integration | Synchronisationsverhalten | Sollen HotelKit-Aufgabenabschlüsse automatisch Roots of Impact-Aufgaben abschließen? | |
| Q5.7 | 5. HotelKit-Integration | Synchronisationsverhalten | Sollen Roots of Impact-Aufgabenabschlüsse zurück zu HotelKit synchronisiert werden? | |
| Q6.1 | 6. Aufgaben-System | Aufgaben-Erstellung & -Verwaltung | Wer erstellt und verwaltet Aufgaben? | • Hotel-Administratoren<br>• Ist ein Admin-Dashboard/Panel erforderlich? |
| Q6.2 | 6. Aufgaben-System | Aufgaben-Erstellung & -Verwaltung | Sollen Aufgaben geplant werden? | nur zu bestimmten Zeiten verfügbar |
| Q6.3 | 6. Aufgaben-System | Aufgaben-Erstellung & -Verwaltung | Können Aufgaben standortspezifisch sein? | nur verfügbar, wenn Benutzer im Hotel ist |
| Q6.4 | 6. Aufgaben-System | Aufgaben-Erstellung & -Verwaltung | Sollten Aufgaben Kategorien/Tags für die Filterung haben? | |
| Q6.5 | 6. Aufgaben-System | Quiz-System | Wie ist die Mindestbestehensnote für Video-Quizzes? | aktuell auf 70% gesetzt |
| Q6.6 | 6. Aufgaben-System | Quiz-System | Sollen Benutzer Quizze wiederholen können, wenn sie nicht bestehen? | |
| Q6.7 | 6. Aufgaben-System | Quiz-System | Wie viele Fragen pro Quiz werden erwartet? | aktuell unterstützt 2-3 |
| Q6.8 | 6. Aufgaben-System | Foto-Aufgaben | Wer moderiert/genehmigt Foto-Einreichungen? | • Automatische Genehmigung<br>• Manuelle Überprüfung erforderlich |
| Q6.9 | 6. Aufgaben-System | Foto-Aufgaben | Was passiert, wenn unangemessene Inhalte hochgeladen werden? | |
| Q6.10 | 6. Aufgaben-System | Foto-Aufgaben | Sollen Fotos öffentlich sichtbar oder nur privat für den Benutzer sein? | |
| Q7.1 | 7. Virtueller Wald | Wald-Visualisierung | Wie viele Bäume sollten im kollektiven Wald sichtbar sein? | aktuell auf 1000 begrenzt |
| Q7.2 | 7. Virtueller Wald | Wald-Visualisierung | Sollten Bäume verschiedene Typen/Modelle basierend auf Aufgabentyp oder verdienten Punkten haben? | |
| Q7.3 | 7. Virtueller Wald | Wald-Visualisierung | Sollte der Wald Zoomen/Pan-Grenzen unterstützen? Wie groß ist die Welt? | |
| Q7.4 | 7. Virtueller Wald | Wald-Visualisierung | Tragen Stakeholder zum selben Wald bei oder separate Wälder pro Organisation? | |
| Q7.5 | 7. Virtueller Wald | Baum-Platzierung | Sollte die Baum-Platzierung zufällig sein oder einem spezifischen Muster/Algorithmus folgen? | |
| Q7.6 | 7. Virtueller Wald | Baum-Platzierung | Können Benutzer Bäume sehen, die von anderen gepflanzt wurden, oder nur anonymisierte Ansicht? | |
| Q7.7 | 7. Virtueller Wald | Baum-Platzierung | Sollte es spezielle/seltene Bäume für große Erfolge geben? | |
| Q8.1 | 8. Statistiken & Berichterstattung | Metriken & KPIs | Welche spezifischen KPIs müssen erfasst und berichtet werden? | |
| Q8.2 | 8. Statistiken & Berichterstattung | Metriken & KPIs | Wer sollte Zugriff auf Statistiken haben? | Admins, Mitarbeiter, Gäste, öffentlich? |
| Q8.3 | 8. Statistiken & Berichterstattung | Metriken & KPIs | Gibt es spezifische Berichtsperioden erforderlich? | tägliche, wöchentliche, monatliche Berichte |
| Q8.4 | 8. Statistiken & Berichterstattung | Metriken & KPIs | Müssen CO₂-Berechnungen von externen Prüfern verifiziert/zertifiziert werden? | |
| Q8.5 | 8. Statistiken & Berichterstattung | Dashboard-Anforderungen | Ist ein Admin-Dashboard für die Verwaltung der Plattform erforderlich? | |
| Q8.6 | 8. Statistiken & Berichterstattung | Dashboard-Anforderungen | Welche Art von Analysen/Berichten werden für das Management benötigt? | |
| Q8.7 | 8. Statistiken & Berichterstattung | Dashboard-Anforderungen | Sollen Statistiken exportierbar sein? | CSV, PDF, Excel |
| Q9.1 | 9. Team-Funktionen | Team-Struktur | Wie sollen Teams organisiert werden? | • Abteilungsbasiert? (Housekeeping, Rezeption, etc.)<br>• Selbst gebildete Teams<br>• Hotelweite Teams |
| Q9.2 | 9. Team-Funktionen | Team-Struktur | Können Gäste Teams beitreten oder nur Mitarbeiter? | |
| Q9.3 | 9. Team-Funktionen | Team-Struktur | Welche Team-Funktionen werden benötigt? | Bestenlisten, Team-Herausforderungen, gemeinsame Belohnungen? |
| Q9.4 | 9. Team-Funktionen | Wettbewerb | Sollte es Wettbewerbe/Herausforderungen zwischen Teams geben? | |
| Q9.5 | 9. Team-Funktionen | Wettbewerb | Wie lange dauern Wettbewerbe? | wöchentlich, monatlich, vierteljährlich? |
| Q9.6 | 9. Team-Funktionen | Wettbewerb | Welche Belohnungen werden für Team-Erfolge vergeben? | |
| Q10.1 | 10. Benachrichtigungen & Kommunikation | Benachrichtigungseinstellungen | Welche Arten von Benachrichtigungen werden benötigt? | • Aufgaben-Erinnerungen<br>• Belohnungs-Verfügbarkeit<br>• Erfolgs-Meilensteine<br>• Team-Updates |
| Q10.2 | 10. Benachrichtigungen & Kommunikation | Benachrichtigungseinstellungen | Bevorzugte Benachrichtigungskanäle? | • Nur In-App<br>• E-Mail-Benachrichtigungen<br>• Push-Benachrichtigungen (mobil)<br>• SMS |
| Q10.3 | 10. Benachrichtigungen & Kommunikation | E-Mail-System | Sollte es E-Mail-Funktionen geben? | Willkommens-E-Mails, Belohnungen, Berichte |
| Q10.4 | 10. Benachrichtigungen & Kommunikation | E-Mail-System | Welcher E-Mail-Service sollte verwendet werden? | SendGrid, AWS SES, benutzerdefiniertes SMTP? |
| Q11.1 | 11. Mehrsprachige Unterstützung | Sprachanforderungen | Welche Sprachen müssen zunächst unterstützt werden? | • Deutsch (als primär erwähnt)<br>• Englisch<br>• Andere |
| Q11.2 | 11. Mehrsprachige Unterstützung | Sprachanforderungen | Sollte die Benutzeroberfläche Sprachumschaltung unterstützen oder eine Sprache pro Bereitstellung? | |
| Q11.3 | 11. Mehrsprachige Unterstützung | Sprachanforderungen | Wird der Inhalt (Aufgaben, Videos) übersetzt oder nur die Benutzeroberfläche? | |
| Q12.1 | 12. Inhalts-Moderation & Sicherheit | Moderation | Wer moderiert benutzergenerierte Inhalte? | Fotos, Kommentare falls vorhanden |
| Q12.2 | 12. Inhalts-Moderation & Sicherheit | Moderation | Welche Moderations-Tools werden benötigt? | Melden, Berichten, Auto-Erkennung? |
| Q12.3 | 12. Inhalts-Moderation & Sicherheit | Moderation | Wie ist die Reaktionszeit für Moderations-Aktionen? | |
| Q13.1 | 13. Bereitstellung & Infrastruktur | Hosting-Umgebung | Wo soll die Anwendung gehostet werden? | AWS, Azure, DigitalOcean, On-Premise? |
| Q13.2 | 13. Bereitstellung & Infrastruktur | Hosting-Umgebung | Was ist die erwartete Benutzer-Skala? | Anzahl gleichzeitiger Benutzer, Gesamtbenutzer |
| Q13.3 | 13. Bereitstellung & Infrastruktur | Hosting-Umgebung | Gibt es spezifische Compliance-Anforderungen für das Hosting? | Datenresidenz, Zertifizierungen |
| Q13.4 | 13. Bereitstellung & Infrastruktur | Domain & Branding | Wie wird der Produktions-Domainname sein? | |
| Q13.5 | 13. Bereitstellung & Infrastruktur | Domain & Branding | Gibt es spezifische Branding-Richtlinien? | Farben, Logos, Schriften, Styling |
| Q13.6 | 13. Bereitstellung & Infrastruktur | Backups & Disaster Recovery | Was sind die Backup-Anforderungen? | Häufigkeit, Aufbewahrungsdauer |
| Q13.7 | 13. Bereitstellung & Infrastruktur | Backups & Disaster Recovery | Was ist die akzeptable Ausfallzeit/RTO/RPO? | |
| Q14.1 | 14. Integration & Drittanbieter-Services | Analytics | Sollte Google Analytics oder ähnliches integriert werden? | |
| Q14.2 | 14. Integration & Drittanbieter-Services | Analytics | Welche Analytics-Ereignisse müssen erfasst werden? | |
| Q14.3 | 14. Integration & Drittanbieter-Services | Zahlungsabwicklung | Ist Zahlungsabwicklung für bestimmte Funktionen erforderlich? | Premium-Belohnungen, etc. |
| Q14.4 | 14. Integration & Drittanbieter-Services | Andere Integrationen | Gibt es andere Hotel-Systeme, die integriert werden müssen? | PMS, POS, Buchungssysteme? |
| Q15.1 | 15. Mobile App | Native App | Ist eine native mobile App erforderlich oder reicht die PWA aus? | |
| Q15.2 | 15. Mobile App | Native App | Falls native App, welche Plattformen? | iOS, Android, beide |
| Q15.3 | 15. Mobile App | App Store | Sollte die App im App Store/Play Store veröffentlicht werden oder Enterprise-Verteilung? | |
| Q16.1 | 16. Erweiterte Funktionen | NFT-Integration | Ist NFT-Integration tatsächlich erforderlich oder war dies optional/Zukunfts-Funktion? | |
| Q16.2 | 16. Erweiterte Funktionen | NFT-Integration | Falls ja, welche Blockchain? Welche NFT-Standards? Kosten? | |
| Q16.3 | 16. Erweiterte Funktionen | Soziale Funktionen | Sollen Benutzer den Fortschritt/Erfolge anderer Benutzer sehen können? | |
| Q16.4 | 16. Erweiterte Funktionen | Soziale Funktionen | Sollte es Social Sharing geben? | Erfolge in sozialen Medien teilen |
| Q16.5 | 16. Erweiterte Funktionen | Soziale Funktionen | Sind Kommentare, Likes oder andere soziale Interaktionen erforderlich? | |
| Q17.1 | 17. Rechtliches & Compliance | Allgemeine Geschäftsbedingungen | Gibt es spezifische Nutzungsbedingungen und Datenschutzerklärung, die integriert werden müssen? | |
| Q17.2 | 17. Rechtliches & Compliance | Allgemeine Geschäftsbedingungen | Sollen Benutzer die Bedingungen während der Registrierung akzeptieren? | |
| Q17.3 | 17. Rechtliches & Compliance | Datenaufbewahrung | Was sind die Datenaufbewahrungsrichtlinien? | wie lange Benutzerdaten, abgeschlossene Aufgaben aufbewahren |
| Q18.1 | 18. Testing & Launch | Pilot-Phase | Wann ist der Start der Pilot-Phase geplant? | |
| Q18.2 | 18. Testing & Launch | Pilot-Phase | Wie viele Benutzer werden an der Pilot-Phase teilnehmen? | |
| Q18.3 | 18. Testing & Launch | Pilot-Phase | Wie ist der Zeitplan für die vollständige Einführung? | |
| Q18.4 | 18. Testing & Launch | Testing | Wer wird am User Acceptance Testing (UAT) beteiligt sein? | |
| Q18.5 | 18. Testing & Launch | Testing | Gibt es spezifische Anwendungsfälle/Szenarien, die getestet werden müssen? | |

## Prioritätsfragen

**Diese sollten zuerst beantwortet werden, da sie die Kernarchitektur beeinflussen:**

| Priorität | Frage IDs | Thema | Begründung |
|-----------|-----------|-------|------------|
| 1 | Q1.1-Q1.3 | Benutzerregistrierung und Verwaltungsablauf | Grundlegende Benutzerverwaltung |
| 2 | Q2.3-Q2.4 | Video-Hosting-Lösung | Beeinflusst Infrastruktur |
| 3 | Q5.1-Q5.4 | HotelKit-API-Details | Kritisch für Integration |
| 4 | Q4.1-Q4.3 | Belohnungssystem-Spezifika | Beeinflusst Datenbank und Geschäftslogik |
| 5 | Q13.1-Q13.2 | Hosting und Skalierung | Beeinflusst Bereitstellungsansatz |
| 6 | Q6.1 | Admin-Panel-Anforderung | Beeinflusst Umfang und Zeitplan |

---

**Hinweis**: Bitte priorisieren Sie die Beantwortung der als "Prioritätsfragen" markierten Fragen, um mit Kern-Entwicklungsentscheidungen fortzufahren.
