"""
Sistema de Gestión Académica Unipamplona
Base de datos SQLite con esquema mejorado
"""

import sqlite3
import hashlib
import json
from datetime import datetime, timedelta

class DatabaseManager:
    """Gestor de base de datos SQLite con seguridad"""
    
    def __init__(self, db_name='academic_system.db'):
        self.db_name = db_name
        self.conn = None
    
    @staticmethod
    def encriptar_password(password: str) -> str:
        """Encripta la contraseña usando SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def connect(self):
        """Establece conexión con la base de datos"""
        self.conn = sqlite3.connect(self.db_name)
        self.conn.row_factory = sqlite3.Row
        return self.conn
    
    def close(self):
        """Cierra la conexión"""
        if self.conn:
            self.conn.close()
    
    def crear_tablas(self):
        """Crea todas las tablas del sistema"""
        cursor = self.conn.cursor()
        
        # Tabla de usuarios mejorada
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            carrera TEXT DEFAULT 'Ingeniería de Sistemas',
            semestre_actual INTEGER NOT NULL,
            tipo_estudio TEXT NOT NULL,  -- intensivo, moderado, leve
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ultima_sesion TIMESTAMP,
            activo BOOLEAN DEFAULT 1
        )
        ''')
        
        # Tabla de cursos del pensum (sin cambios mayores)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS cursos (
            codigo TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            creditos INTEGER NOT NULL,
            semestre INTEGER NOT NULL,
            iit INTEGER DEFAULT 0,
            hp INTEGER DEFAULT 0,
            hitp INTEGER DEFAULT 0,
            requisitos TEXT,  -- JSON array
            ponderacion_academica INTEGER DEFAULT 0
        )
        ''')
        
        # Tabla de historial académico (materias que ya pasó)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS historial_academico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            curso_codigo TEXT NOT NULL,
            semestre_cursado INTEGER,
            nota_final REAL,
            estado TEXT DEFAULT 'aprobado',  -- aprobado, reprobado, cursando
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (curso_codigo) REFERENCES cursos(codigo),
            UNIQUE(usuario_id, curso_codigo)
        )
        ''')
        
        # Tabla de materias actuales (las que está viendo)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS materias_actuales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            curso_codigo TEXT NOT NULL,
            semestre_cursando INTEGER NOT NULL,
            estado TEXT DEFAULT 'activo',  -- activo, cancelado
            fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_cancelacion TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (curso_codigo) REFERENCES cursos(codigo),
            UNIQUE(usuario_id, curso_codigo)
        )
        ''')
        
        # Tabla de tareas mejorada
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS tareas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            curso_codigo TEXT NOT NULL,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            tipo TEXT NOT NULL,  -- taller, parcial, proyecto, lectura, exposicion, quiz
            fecha_limite DATETIME NOT NULL,
            hora_limite TIME,
            horas_estimadas REAL NOT NULL,
            dificultad INTEGER NOT NULL CHECK(dificultad BETWEEN 1 AND 5),
            prioridad INTEGER DEFAULT 0,  -- 0-10, calculada automáticamente
            completada BOOLEAN DEFAULT 0,
            porcentaje_completado INTEGER DEFAULT 0,
            notas TEXT,  -- notas del estudiante
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_completada TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (curso_codigo) REFERENCES cursos(codigo)
        )
        ''')
        
        # Tabla de calendario académico institucional
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS calendario_institucional (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_evento TEXT NOT NULL,
            descripcion TEXT,
            fecha_inicio DATE NOT NULL,
            fecha_fin DATE,
            tipo TEXT NOT NULL,  -- parcial, final, cancelacion, inscripcion, festivo, inicio_clases, fin_clases
            semestre TEXT,  -- 2025-1, 2025-2
            icono TEXT,
            color TEXT DEFAULT '#3B82F6'
        )
        ''')
        
        # Tabla de configuración de plan de estudio
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS configuracion_estudio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            tipo_estudio TEXT NOT NULL,  -- intensivo, moderado, leve
            horas_diarias REAL NOT NULL,
            dias_semana TEXT,  -- JSON array [1,2,3,4,5] = Lun-Vie
            hora_inicio_preferida TIME,
            hora_fin_preferida TIME,
            descansos_entre_sesiones INTEGER DEFAULT 15,  -- minutos
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            UNIQUE(usuario_id)
        )
        ''')
        
        # Tabla de notificaciones
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS notificaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            tarea_id INTEGER,
            tipo TEXT NOT NULL,  -- recordatorio, vencimiento, recomendacion
            titulo TEXT NOT NULL,
            mensaje TEXT,
            leida BOOLEAN DEFAULT 0,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_envio TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE
        )
        ''')
        
        # Tabla de sesiones de estudio
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS sesiones_estudio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            tarea_id INTEGER,
            curso_codigo TEXT,
            fecha_inicio TIMESTAMP NOT NULL,
            fecha_fin TIMESTAMP,
            duracion_minutos INTEGER,
            notas TEXT,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE SET NULL,
            FOREIGN KEY (curso_codigo) REFERENCES cursos(codigo)
        )
        ''')
        
        self.conn.commit()
        print("✓ Tablas creadas exitosamente")
    
    def insertar_pensum_sistemas(self):
        """Inserta el pensum completo de Ingeniería de Sistemas"""
        cursor = self.conn.cursor()
        
        pensum = [
            # SEMESTRE 1
            {"codigo": "171342", "nombre": "ACTIVIDAD DEPORTIVA, RECREATIVA Y CULTURAL", "creditos": 1, "semestre": 1, "iit": 0, "hp": 3, "requisitos": []},
            {"codigo": "153002", "nombre": "CÁTEDRA FARIA", "creditos": 2, "semestre": 1, "iit": 4, "hp": 0, "requisitos": []},
            {"codigo": "167389", "nombre": "INFORMÁTICA BÁSICA", "creditos": 3, "semestre": 1, "iit": 0, "hp": 3, "requisitos": []},
            {"codigo": "162274", "nombre": "INGLÉS NIVEL I", "creditos": 2, "semestre": 1, "iit": 1, "hp": 3, "requisitos": []},
            {"codigo": "157408", "nombre": "ÁLGEBRA LINEAL", "creditos": 2, "semestre": 1, "iit": 1, "hp": 3, "requisitos": []},
            {"codigo": "167391", "nombre": "INTRODUCCIÓN A LA INGENIERÍA DE SISTEMAS", "creditos": 2, "semestre": 1, "iit": 4, "hp": 0, "requisitos": []},
            {"codigo": "167390", "nombre": "PENSAMIENTO COMPUTACIONAL", "creditos": 3, "semestre": 1, "iit": 2, "hp": 4, "requisitos": []},
            {"codigo": "162003", "nombre": "HABILIDADES COMUNICATIVAS", "creditos": 2, "semestre": 1, "iit": 2, "hp": 0, "requisitos": []},
            
            # SEMESTRE 2
            {"codigo": "167396-1", "nombre": "CRÉDITOS DE LIBRE ELECCIÓN", "creditos": 3, "semestre": 2, "iit": 0, "hp": 0, "ponderacion_academica": 15, "requisitos": []},
            {"codigo": "164374", "nombre": "FORMACIÓN CIUDADANA Y CULTURA DE LA PAZ", "creditos": 1, "semestre": 2, "iit": 0, "hp": 3, "requisitos": []},
            {"codigo": "162275", "nombre": "INGLÉS NIVEL II", "creditos": 2, "semestre": 2, "iit": 1, "hp": 3, "requisitos": ["162274"]},
            {"codigo": "157400", "nombre": "CÁLCULO DIFERENCIAL", "creditos": 3, "semestre": 2, "iit": 2, "hp": 3, "requisitos": []},
            {"codigo": "167392", "nombre": "FUNDAMENTOS DE PROGRAMACIÓN", "creditos": 3, "semestre": 2, "iit": 2, "hp": 4, "requisitos": ["167390"]},
            {"codigo": "167393", "nombre": "GESTIÓN DE PROYECTOS", "creditos": 3, "semestre": 2, "iit": 2, "hp": 2, "requisitos": []},
            {"codigo": "164004", "nombre": "EDUCACIÓN AMBIENTAL", "creditos": 2, "semestre": 2, "iit": 2, "hp": 0, "requisitos": []},
            {"codigo": "150001", "nombre": "ELECTIVA SOCIOHUMANÍSTICA I", "creditos": 2, "semestre": 2, "iit": 2, "hp": 0, "requisitos": []},
            
            # SEMESTRE 3
            {"codigo": "162276", "nombre": "INGLÉS NIVEL III", "creditos": 2, "semestre": 3, "iit": 1, "hp": 3, "requisitos": ["162275"]},
            {"codigo": "157401", "nombre": "CÁLCULO INTEGRAL", "creditos": 3, "semestre": 3, "iit": 2, "hp": 3, "requisitos": ["157400"]},
            {"codigo": "167395", "nombre": "ESTADÍSTICA Y PROBABILIDAD", "creditos": 4, "semestre": 3, "iit": 2, "hp": 4, "requisitos": []},
            {"codigo": "157405", "nombre": "MECÁNICA", "creditos": 3, "semestre": 3, "iit": 2, "hp": 3, "requisitos": ["157400"]},
            {"codigo": "167394", "nombre": "PROGRAMACIÓN ORIENTADA A OBJETOS", "creditos": 3, "semestre": 3, "iit": 2, "hp": 4, "requisitos": ["167392"]},
            {"codigo": "150002", "nombre": "ELECTIVA SOCIOHUMANÍSTICA II", "creditos": 2, "semestre": 3, "iit": 2, "hp": 0, "requisitos": []},
            
            # SEMESTRE 4
            {"codigo": "157402", "nombre": "CÁLCULO MULTIVARIABLE", "creditos": 3, "semestre": 4, "iit": 2, "hp": 3, "requisitos": ["157401"]},
            {"codigo": "157406", "nombre": "ELECTROMAGNETISMO", "creditos": 3, "semestre": 4, "iit": 2, "hp": 3, "requisitos": ["157405"]},
            {"codigo": "167396", "nombre": "ESTRUCTURA DE DATOS Y ANÁLISIS DE ALGORITMOS", "creditos": 4, "semestre": 4, "iit": 2, "hp": 4, "requisitos": ["167394"]},
            {"codigo": "167397", "nombre": "SISTEMAS DE INFORMACIÓN", "creditos": 4, "semestre": 4, "iit": 4, "hp": 2, "requisitos": ["167393"]},
            {"codigo": "164010", "nombre": "ÉTICA", "creditos": 2, "semestre": 4, "iit": 2, "hp": 0, "requisitos": []},
            
            # SEMESTRE 5
            {"codigo": "157403", "nombre": "ECUACIONES DIFERENCIALES", "creditos": 3, "semestre": 5, "iit": 2, "hp": 3, "requisitos": ["157402"]},
            {"codigo": "167402", "nombre": "ARQUITECTURAS EMPRESARIALES", "creditos": 4, "semestre": 5, "iit": 2, "hp": 4, "requisitos": ["167397"]},
            {"codigo": "167401", "nombre": "BASE DE DATOS I", "creditos": 3, "semestre": 5, "iit": 2, "hp": 4, "requisitos": ["167394"]},
            {"codigo": "167399", "nombre": "ESTRUCTURAS COMPUTACIONALES DISCRETAS", "creditos": 3, "semestre": 5, "iit": 2, "hp": 4, "requisitos": ["167396"]},
            {"codigo": "167398", "nombre": "PLATAFORMAS TECNOLÓGICAS", "creditos": 3, "semestre": 5, "iit": 2, "hp": 2, "requisitos": ["167396"]},
            {"codigo": "167400", "nombre": "INVESTIGACIÓN EN INGENIERÍA DE SISTEMAS", "creditos": 2, "semestre": 5, "iit": 2, "hp": 2, "ponderacion_academica": 64, "requisitos": []},
            
            # SEMESTRE 6
            {"codigo": "167403", "nombre": "ALGORITMOS NUMÉRICOS PARA INGENIERÍA", "creditos": 3, "semestre": 6, "iit": 2, "hp": 2, "requisitos": ["157403"]},
            {"codigo": "167406", "nombre": "BASE DE DATOS II", "creditos": 3, "semestre": 6, "iit": 2, "hp": 4, "requisitos": ["167401"]},
            {"codigo": "167404", "nombre": "DESARROLLO ORIENTADO A PLATAFORMAS", "creditos": 3, "semestre": 6, "iit": 2, "hp": 3, "requisitos": ["167401"]},
            {"codigo": "167405", "nombre": "LÓGICA Y REPRESENTACIÓN DEL CONOCIMIENTO", "creditos": 3, "semestre": 6, "iit": 2, "hp": 2, "requisitos": ["167399"]},
            
            # SEMESTRE 7
            {"codigo": "167409", "nombre": "PARADIGMAS DE PROGRAMACIÓN", "creditos": 3, "semestre": 7, "iit": 2, "hp": 2, "requisitos": ["167405"]},
            {"codigo": "167407", "nombre": "REDES", "creditos": 4, "semestre": 7, "iit": 2, "hp": 4, "requisitos": ["167398"]},
            {"codigo": "167408", "nombre": "TEORÍA DE LA COMPUTACIÓN", "creditos": 3, "semestre": 7, "iit": 2, "hp": 2, "requisitos": ["167399"]},
            {"codigo": "167410", "nombre": "PROYECTO INTEGRADOR", "creditos": 2, "semestre": 7, "iit": 0, "hp": 2, "ponderacion_academica": 99, "requisitos": []},
            
            # SEMESTRE 8
            {"codigo": "167411", "nombre": "FUNDAMENTOS DE COMPUTACIÓN PARALELA Y DISTRIBUIDA", "creditos": 3, "semestre": 8, "iit": 2, "hp": 4, "requisitos": ["167398"]},
            {"codigo": "167412", "nombre": "INGENIERÍA DEL SOFTWARE I", "creditos": 4, "semestre": 8, "iit": 2, "hp": 2, "requisitos": ["167397", "157401", "167406"]},
            {"codigo": "167414", "nombre": "MODELADO Y SIMULACIÓN DE SISTEMAS CONTINUOS", "creditos": 3, "semestre": 8, "iit": 2, "hp": 4, "requisitos": ["157403", "167399"]},
            {"codigo": "167413", "nombre": "SISTEMAS INTELIGENTES", "creditos": 4, "semestre": 8, "iit": 2, "hp": 4, "requisitos": []},
            
            # SEMESTRE 9
            {"codigo": "167417", "nombre": "CIENCIA DE DATOS", "creditos": 3, "semestre": 9, "iit": 2, "hp": 2, "requisitos": ["167413"]},
            {"codigo": "167415", "nombre": "INGENIERÍA DEL SOFTWARE II", "creditos": 4, "semestre": 9, "iit": 2, "hp": 2, "requisitos": ["167412"]},
            {"codigo": "167416", "nombre": "LEGISLACIÓN INFORMÁTICA Y ASUNTOS SOCIALES", "creditos": 2, "semestre": 9, "iit": 4, "hp": 0, "ponderacion_academica": 150, "requisitos": []},
            {"codigo": "167418", "nombre": "MODELADO Y SIMULACIÓN DE SISTEMAS DISCRETOS", "creditos": 3, "semestre": 9, "iit": 2, "hp": 2, "requisitos": ["167399", "167396"]},
            
            # SEMESTRE 10
            {"codigo": "167420", "nombre": "INGENIERÍA DEL SOFTWARE III", "creditos": 4, "semestre": 10, "iit": 2, "hp": 2, "requisitos": ["167415"]},
            {"codigo": "167421", "nombre": "SEGURIDAD INFORMÁTICA", "creditos": 3, "semestre": 10, "iit": 2, "hp": 2, "requisitos": ["167407"]},
            {"codigo": "167419", "nombre": "TRABAJO DE GRADO", "creditos": 6, "semestre": 10, "iit": 0, "hp": 2, "ponderacion_academica": 150, "requisitos": []},
        ]
        
        for materia in pensum:
            try:
                cursor.execute('''
                INSERT OR REPLACE INTO cursos 
                (codigo, nombre, creditos, semestre, iit, hp, hitp, requisitos, ponderacion_academica)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    materia["codigo"],
                    materia["nombre"],
                    materia["creditos"],
                    materia["semestre"],
                    materia.get("iit", 0),
                    materia.get("hp", 0),
                    materia.get("hitp", 0),
                    json.dumps(materia.get("requisitos", [])),
                    materia.get("ponderacion_academica", 0)
                ))
            except Exception as e:
                print(f"Error insertando {materia['codigo']}: {e}")
        
        self.conn.commit()
        print(f"✓ Pensum insertado: {len(pensum)} materias")
    
    def insertar_calendario_2025(self):
        """Inserta fechas del calendario académico 2025"""
        cursor = self.conn.cursor()
        
        eventos = [
            # Semestre 2025-1
            ("Inicio de Clases 2025-1", "Inicio del primer semestre académico", "2025-01-20", None, "inicio_clases", "2025-1", "🎓", "#10B981"),
            ("Primer Parcial", "Evaluación del primer corte", "2025-03-10", "2025-03-14", "parcial", "2025-1", "📝", "#F59E0B"),
            ("Segundo Parcial", "Evaluación del segundo corte", "2025-04-21", "2025-04-25", "parcial", "2025-1", "📝", "#F59E0B"),
            ("Fecha Límite Cancelación", "Último día para cancelar materias sin penalidad", "2025-04-25", None, "cancelacion", "2025-1", "⚠️", "#EF4444"),
            ("Examen Final 2025-1", "Evaluaciones finales del semestre", "2025-05-19", "2025-05-23", "final", "2025-1", "📝", "#DC2626"),
            ("Fin de Semestre 2025-1", "Finalización del primer semestre", "2025-05-30", None, "fin_clases", "2025-1", "🎉", "#8B5CF6"),
            
            # Inscripciones
            ("Inscripciones 2025-2", "Periodo de inscripción para segundo semestre", "2025-06-02", "2025-06-13", "inscripcion", "2025-2", "📋", "#3B82F6"),
            
            # Semestre 2025-2
            ("Inicio de Clases 2025-2", "Inicio del segundo semestre académico", "2025-07-28", None, "inicio_clases", "2025-2", "🎓", "#10B981"),
            ("Primer Parcial 2025-2", "Evaluación del primer corte", "2025-09-22", "2025-09-26", "parcial", "2025-2", "📝", "#F59E0B"),
            ("Segundo Parcial 2025-2", "Evaluación del segundo corte", "2025-10-27", "2025-10-31", "parcial", "2025-2", "📝", "#F59E0B"),
            ("Fecha Límite Cancelación 2025-2", "Último día para cancelar materias", "2025-10-31", None, "cancelacion", "2025-2", "⚠️", "#EF4444"),
            ("Examen Final 2025-2", "Evaluaciones finales del semestre", "2025-11-24", "2025-11-28", "final", "2025-2", "📝", "#DC2626"),
            
            # Festivos
            ("Día del Trabajo", "Festivo nacional", "2025-05-01", None, "festivo", None, "🎉", "#6366F1"),
            ("Día de la Independencia", "Festivo nacional", "2025-07-20", None, "festivo", None, "🎉", "#6366F1"),
            ("Batalla de Boyacá", "Festivo nacional", "2025-08-07", None, "festivo", None, "🎉", "#6366F1"),
            ("Día de la Raza", "Festivo nacional", "2025-10-13", None, "festivo", None, "🎉", "#6366F1"),
        ]
        
        for evento in eventos:
            cursor.execute('''
            INSERT OR REPLACE INTO calendario_institucional 
            (nombre_evento, descripcion, fecha_inicio, fecha_fin, tipo, semestre, icono, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', evento)
        
        self.conn.commit()
        print(f"✓ Calendario académico insertado: {len(eventos)} eventos")
    
    def crear_indices(self):
        """Crea índices para mejorar rendimiento"""
        cursor = self.conn.cursor()
        
        indices = [
            "CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)",
            "CREATE INDEX IF NOT EXISTS idx_tareas_usuario ON tareas(usuario_id)",
            "CREATE INDEX IF NOT EXISTS idx_tareas_fecha ON tareas(fecha_limite)",
            "CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_academico(usuario_id)",
            "CREATE INDEX IF NOT EXISTS idx_materias_actuales_usuario ON materias_actuales(usuario_id)",
        ]
        
        for idx in indices:
            cursor.execute(idx)
        
        self.conn.commit()
        print("✓ Índices creados")


def inicializar_base_datos():
    """Función principal de inicialización"""
    print("🚀 Inicializando Sistema Académico Unipamplona")
    print("=" * 70)
    
    db = DatabaseManager()
    db.connect()
    
    db.crear_tablas()
    db.insertar_pensum_sistemas()
    db.insertar_calendario_2025()
    db.crear_indices()
    
    print("=" * 70)
    print("✅ Base de datos inicializada correctamente")
    print(f"📂 Archivo: {db.db_name}")
    
    db.close()


if __name__ == "__main__":
    inicializar_base_datos()