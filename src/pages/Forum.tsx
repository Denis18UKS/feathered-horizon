import React, { useState, useEffect, useRef } from "react";

// Интерфейсы
interface Question {
    id: number;
    title: string;
    description: string;
    user: string;
    user_id: number;
    created_at: string;
    status: string;
}

interface Answer {
    id: number;
    user: string;
    answer: string;
}

const Forum: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [newQuestion, setNewQuestion] = useState({ title: "", description: "" });
    const [newAnswer, setNewAnswer] = useState("");
    const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [showAnswerModal, setShowAnswerModal] = useState(false);
    const [showAddAnswerModal, setShowAddAnswerModal] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);
    const answerModalRef = useRef<HTMLDivElement>(null);
    const addAnswerModalRef = useRef<HTMLDivElement>(null);

    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchQuestions();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) setShowModal(false);
            if (answerModalRef.current && !answerModalRef.current.contains(e.target as Node)) setShowAnswerModal(false);
            if (addAnswerModalRef.current && !addAnswerModalRef.current.contains(e.target as Node)) setShowAddAnswerModal(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await fetch("http://localhost:5000/forums");
            const data = await res.json();
            setQuestions(data);
        } catch (error) {
            console.error("Ошибка при получении вопросов:", error);
        }
    };

    const fetchAnswers = async (questionId: number) => {
        try {
            const res = await fetch(`http://localhost:5000/forums/${questionId}/answers`);
            const data = await res.json();
            setAnswers(data);
            setShowAnswerModal(true);
        } catch (error) {
            console.error("Ошибка при получении ответов:", error);
        }
    };

    const addQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newQuestion.title || !newQuestion.description) return;

        try {
            const res = await fetch("http://localhost:5000/forums", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...newQuestion, user_id: userId }),
            });

            if (res.ok) {
                const newQ = await res.json();
                setQuestions((prev) => [...prev, newQ]);
                setShowModal(false);
                setNewQuestion({ title: "", description: "" });
            }
        } catch (error) {
            console.error("Ошибка при добавлении вопроса:", error);
        }
    };

    const addAnswer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newAnswer || !selectedQuestion) return;

        try {
            const res = await fetch(`http://localhost:5000/forums/${selectedQuestion}/answers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ answer: newAnswer, user_id: userId, question_id: selectedQuestion }),
            });

            if (res.ok) {
                const newA = await res.json();
                setAnswers((prev) => [...prev, newA]);
                setShowAddAnswerModal(false);
                setNewAnswer("");
            }
        } catch (error) {
            console.error("Ошибка при добавлении ответа:", error);
        }
    };

    const closeQuestion = async (questionId: number) => {
        try {
            const res = await fetch(`http://localhost:5000/forums/${questionId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: "решён" }),
            });

            if (res.ok) {
                setQuestions((prev) =>
                    prev.map((q) => (q.id === questionId ? { ...q, status: "решён" } : q))
                );
            }
        } catch (error) {
            console.error("Ошибка при закрытии вопроса:", error);
        }
    };

    return (
        <div className="forum-page">
            <main>
                <section className="forum">
                    <h2>Форум</h2>
                    <p>Задавайте вопросы и делитесь знаниями.</p>

                    <button className="btn" onClick={() => setShowModal(true)}>
                        Задать вопрос
                    </button>

                    <div className="questions">
                        {questions.map((q) => (
                            <article key={q.id} className={`question ${q.status === "решён" ? "resolved" : ""}`}>
                                <h3>{q.title}</h3>
                                <p>{q.description}</p>
                                <p><strong>Автор:</strong> {q.user || "Аноним"}</p>
                                <p><strong>Дата:</strong> {new Date(q.created_at).toLocaleDateString()}</p>
                                <p><strong>Статус:</strong> {q.status}</p>

                                <button className="btn" onClick={() => { setSelectedQuestion(q.id); fetchAnswers(q.id); }}>
                                    Ответы
                                </button>

                                {q.status !== "решён" && (
                                    <>
                                        {String(q.user_id) !== String(userId) && (
                                            <button className="btn" onClick={() => { setSelectedQuestion(q.id); setShowAddAnswerModal(true); }}>
                                                Ответить
                                            </button>
                                        )}
                                        {String(q.user_id) === String(userId) && (
                                            <button className="btn" onClick={() => closeQuestion(q.id)}>
                                                Закрыть
                                            </button>
                                        )}
                                    </>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Forum;
