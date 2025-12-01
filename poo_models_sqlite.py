"""
Modelos POO con SQLite - Sistema Académico Unipamplona
Incluye encriptación y el nuevo flujo de registro
"""

import sqlite3
import hashlib
import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple

# ========== CLASE BASE ==========

class DatabaseModel:
    """Clase base con utilidades comunes"""
    DB_NAME = 'academic_system.db'
    
    @staticmethod
    def get_connection():
        conn = sqlite3.connect(DatabaseModel.DB_NAME)
        conn.row_factory = sqlite3.Row
        return conn
    
    @staticmethod
    def encriptar_password(password: str) -> str:
        """Encripta contraseña con SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()


# ========== USUARIO ==========

class Usuario(DatabaseModel):
    """Modelo de Usuario con registro mejorado"""
    
    def __init__(self, id=None, nombre=None, apellido=None, email=None,
                 carrera=None, semestre_actual=None, tipo_estudio=None):
        self.id = id
        self.nombre = nombre
        self.apellido = apellido
        self.email = email
        self.carrera = carrera
        self.semestre_actual = semestre_actual
        self.tipo_estudio = tipo_estudio
    
    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellido}"
    
    @classmethod
    def crear(cls, nombre: str, apellido: str, email: str, password: str,
              semestre_actual: int, tipo_estudio: str,
              materias_aprobadas: List[str] = None,
              materias_cursando: List[str] = None) -> 'Usuario':
        """
        Crea un nuevo usuario con su perfil académico completo
        
        Args:
            nombre: Nombre del estudiante
            apellido: Apellido del estudiante
            email: Email institucional
            password: Contraseña (será encriptada)
            semestre_actual: Semestre en curso (1-10)
            tipo_estudio: 'intensivo', 'moderado' o 'leve'
            materias_aprobadas: Lista de códigos de materias ya aprobadas
            materias_cursando: Lista de códigos de materias actuales
        """
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        try:
            # Crear usuario
            password_hash = cls.encriptar_password(password)
            cursor.execute('''
            INSERT INTO usuarios 
            (nombre, apellido, email, password_hash, semestre_actual, tipo_estudio, carrera)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (nombre, apellido, email, password_hash, semestre_actual, 
                  tipo_estudio, 'Ingeniería de Sistemas'))
            
            usuario_id = cursor.lastrowid
            
            # Registrar materias aprobadas
            if materias_aprobadas:
                for codigo in materias_aprobadas:
                    cursor.execute('''
                    INSERT INTO historial_academico (usuario_id, curso_codigo, estado)
                    VALUES (?, ?, 'aprobado')
                    ''', (usuario_id, codigo))
            
            # Registrar materias actuales
            if materias_cursando:
                for codigo in materias_cursando:
                    cursor.execute('''
                    INSERT INTO materias_actuales (usuario_id, curso_codigo, semestre_cursando)
                    VALUES (?, ?, ?)
                    ''', (usuario_id, codigo, semestre_actual))
            
            # Crear configuración de estudio
            horas_map = {
                'intensivo': 6.0,
                'moderado': 4.0,
                'leve': 2.5
            }
            cursor.execute('''
            INSERT INTO configuracion_estudio 
            (usuario_id, tipo_estudio, horas_diarias, dias_semana, hora_inicio_preferida, hora_fin_preferida)
            VALUES (?, ?, ?, ?, ?, ?)
            ''', (usuario_id, tipo_estudio, horas_map[tipo_estudio], 
                  json.dumps([1,2,3,4,5]), '08:00', '22:00'))
            
            conn.commit()
            return cls.obtener_por_id(usuario_id)
            
        except sqlite3.IntegrityError:
            raise ValueError(f"El email '{email}' ya está registrado")
        finally:
            conn.close()
    
    @classmethod
    def autenticar(cls, email: str, password: str) -> Optional['Usuario']:
        """Autentica un usuario por email y contraseña"""
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        password_hash = cls.encriptar_password(password)
        
        cursor.execute('''
        SELECT * FROM usuarios 
        WHERE email = ? AND password_hash = ? AND activo = 1
        ''', (email, password_hash))
        
        row = cursor.fetchone()
        
        if row:
            # Actualizar última sesión
            cursor.execute('''
            UPDATE usuarios SET ultima_sesion = CURRENT_TIMESTAMP WHERE id = ?
            ''', (row['id'],))
            conn.commit()
        
        conn.close()
        
        if row:
            return cls(
                id=row['id'],
                nombre=row['nombre'],
                apellido=row['apellido'],
                email=row['email'],
                carrera=row['carrera'],
                semestre_actual=row['semestre_actual'],
                tipo_estudio=row['tipo_estudio']
            )
        return None
    
    @classmethod
    def obtener_por_id(cls, usuario_id: int) -> Optional['Usuario']:
        """Obtiene usuario por ID"""
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM usuarios WHERE id = ?', (usuario_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return cls(
                id=row['id'],
                nombre=row['nombre'],
                apellido=row['apellido'],
                email=row['email'],
                carrera=row['carrera'],
                semestre_actual=row['semestre_actual'],
                tipo_estudio=row['tipo_estudio']
            )
        return None
    
    def obtener_materias_actuales(self) -> List['Curso']:
        """Obtiene las materias que está cursando actualmente"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT c.* FROM cursos c
        INNER JOIN materias_actuales ma ON c.codigo = ma.curso_codigo
        WHERE ma.usuario_id = ? AND ma.estado = 'activo'
        ORDER BY c.nombre
        ''', (self.id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [Curso.from_row(row) for row in rows]
    
    def obtener_materias_aprobadas(self) -> List['Curso']:
        """Obtiene las materias que ya aprobó"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT c.* FROM cursos c
        INNER JOIN historial_academico ha ON c.codigo = ha.curso_codigo
        WHERE ha.usuario_id = ? AND ha.estado = 'aprobado'
        ORDER BY c.semestre, c.nombre
        ''', (self.id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [Curso.from_row(row) for row in rows]
    
    def puede_inscribir_materia(self, codigo_materia: str) -> Tuple[bool, str]:
        """
        Verifica si puede inscribir una materia
        Returns: (puede, razon)
        """
        curso = Curso.obtener_por_codigo(codigo_materia)
        if not curso:
            return False, "Materia no encontrada"
        
        # Verificar si ya la aprobó
        materias_aprobadas = [c.codigo for c in self.obtener_materias_aprobadas()]
        if codigo_materia in materias_aprobadas:
            return False, "Ya aprobaste esta materia"
        
        # Verificar si ya la está cursando
        materias_actuales = [c.codigo for c in self.obtener_materias_actuales()]
        if codigo_materia in materias_actuales:
            return False, "Ya estás cursando esta materia"
        
        # Verificar requisitos
        if curso.requisitos:
            for req in curso.requisitos:
                if req not in materias_aprobadas:
                    req_nombre = Curso.obtener_por_codigo(req)
                    return False, f"Falta requisito: {req_nombre.nombre if req_nombre else req}"
        
        return True, "OK"
    
    def inscribir_materia(self, codigo_materia: str) -> bool:
        """Inscribe una materia actual"""
        puede, razon = self.puede_inscribir_materia(codigo_materia)
        if not puede:
            raise ValueError(razon)
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO materias_actuales (usuario_id, curso_codigo, semestre_cursando)
        VALUES (?, ?, ?)
        ''', (self.id, codigo_materia, self.semestre_actual))
        
        conn.commit()
        conn.close()
        return True
    
    def cancelar_materia(self, codigo_materia: str) -> bool:
        """Cancela una materia actual"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        UPDATE materias_actuales 
        SET estado = 'cancelado', fecha_cancelacion = CURRENT_TIMESTAMP
        WHERE usuario_id = ? AND curso_codigo = ? AND estado = 'activo'
        ''', (self.id, codigo_materia))
        
        affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        return affected > 0
    
    def obtener_tareas(self, solo_pendientes: bool = False) -> List['Tarea']:
        """Obtiene todas las tareas del usuario"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM tareas WHERE usuario_id = ?'
        params = [self.id]
        
        if solo_pendientes:
            query += ' AND completada = 0'
        
        query += ' ORDER BY fecha_limite ASC, prioridad DESC'
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [Tarea.from_row(row) for row in rows]
    
    def agregar_tarea(self, curso_codigo: str, titulo: str, tipo: str,
                     fecha_limite: str, horas_estimadas: float,
                     dificultad: int, descripcion: str = "",
                     hora_limite: str = None) -> 'Tarea':
        """Agrega una nueva tarea"""
        return Tarea.crear(
            usuario_id=self.id,
            curso_codigo=curso_codigo,
            titulo=titulo,
            descripcion=descripcion,
            tipo=tipo,
            fecha_limite=fecha_limite,
            hora_limite=hora_limite,
            horas_estimadas=horas_estimadas,
            dificultad=dificultad
        )
    
    def obtener_configuracion_estudio(self) -> Dict:
        """Obtiene la configuración de estudio del usuario"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM configuracion_estudio WHERE usuario_id = ?
        ''', (self.id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'tipo_estudio': row['tipo_estudio'],
                'horas_diarias': row['horas_diarias'],
                'dias_semana': json.loads(row['dias_semana']),
                'hora_inicio': row['hora_inicio_preferida'],
                'hora_fin': row['hora_fin_preferida'],
                'descansos': row['descansos_entre_sesiones']
            }
        return None
    
    def obtener_estadisticas(self) -> Dict:
        """Calcula estadísticas del usuario"""
        tareas = self.obtener_tareas()
        tareas_pendientes = [t for t in tareas if not t.completada]
        tareas_completadas = [t for t in tareas if t.completada]
        
        materias_actuales = self.obtener_materias_actuales()
        materias_aprobadas = self.obtener_materias_aprobadas()
        
        total_creditos_actuales = sum(m.creditos for m in materias_actuales)
        total_creditos_aprobados = sum(m.creditos for m in materias_aprobadas)
        
        return {
            'total_tareas': len(tareas),
            'pendientes': len(tareas_pendientes),
            'completadas': len(tareas_completadas),
            'horas_pendientes': sum(t.horas_estimadas for t in tareas_pendientes),
            'materias_actuales': len(materias_actuales),
            'materias_aprobadas': len(materias_aprobadas),
            'creditos_actuales': total_creditos_actuales,
            'creditos_aprobados': total_creditos_aprobados,
            'porcentaje_completado': (len(tareas_completadas) / len(tareas) * 100) if tareas else 0
        }


# ========== CURSO ==========

class Curso(DatabaseModel):
    """Modelo de Curso del pensum"""
    
    def __init__(self, codigo: str, nombre: str, creditos: int,
                 semestre: int, iit: int = 0, hp: int = 0,
                 requisitos: List[str] = None):
        self.codigo = codigo
        self.nombre = nombre
        self.creditos = creditos
        self.semestre = semestre
        self.iit = iit
        self.hp = hp
        self.requisitos = requisitos or []
        self.peso = creditos
    
    @classmethod
    def from_row(cls, row) -> 'Curso':
        return cls(
            codigo=row['codigo'],
            nombre=row['nombre'],
            creditos=row['creditos'],
            semestre=row['semestre'],
            iit=row['iit'],
            hp=row['hp'],
            requisitos=json.loads(row['requisitos']) if row['requisitos'] else []
        )
    
    @classmethod
    def obtener_por_codigo(cls, codigo: str) -> Optional['Curso']:
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM cursos WHERE codigo = ?', (codigo,))
        row = cursor.fetchone()
        conn.close()
        
        return cls.from_row(row) if row else None
    
    @classmethod
    def obtener_por_semestre(cls, semestre: int) -> List['Curso']:
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM cursos WHERE semestre = ? ORDER BY nombre
        ''', (semestre,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [cls.from_row(row) for row in rows]
    
    @classmethod
    def obtener_todos(cls) -> List['Curso']:
        """Obtiene todas las materias del pensum"""
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM cursos ORDER BY semestre, nombre')
        rows = cursor.fetchall()
        conn.close()
        
        return [cls.from_row(row) for row in rows]
    
    @classmethod
    def buscar(cls, termino: str) -> List['Curso']:
        """Busca materias por nombre o código"""
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM cursos 
        WHERE codigo LIKE ? OR nombre LIKE ?
        ORDER BY semestre, nombre
        ''', (f'%{termino}%', f'%{termino}%'))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [cls.from_row(row) for row in rows]
    
    def __repr__(self):
        return f"Curso({self.codigo}, {self.nombre}, {self.creditos} créditos)"


# ========== TAREA ==========

class Tarea(DatabaseModel):
    """Modelo de Tarea mejorado"""
    
    def __init__(self, id: int, usuario_id: int, curso_codigo: str,
                 titulo: str, descripcion: str, tipo: str,
                 fecha_limite: datetime, hora_limite: str,
                 horas_estimadas: float, dificultad: int,
                 prioridad: int, completada: bool,
                 porcentaje_completado: int, notas: str,
                 fecha_creacion: datetime, fecha_completada: datetime):
        self.id = id
        self.usuario_id = usuario_id
        self.curso_codigo = curso_codigo
        self.titulo = titulo
        self.descripcion = descripcion
        self.tipo = tipo
        self.fecha_limite = fecha_limite
        self.hora_limite = hora_limite
        self.horas_estimadas = horas_estimadas
        self.dificultad = dificultad
        self.prioridad = prioridad
        self.completada = completada
        self.porcentaje_completado = porcentaje_completado
        self.notas = notas
        self.fecha_creacion = fecha_creacion
        self.fecha_completada = fecha_completada
        
        self.curso = Curso.obtener_por_codigo(curso_codigo)
    
    @classmethod
    def from_row(cls, row) -> 'Tarea':
        return cls(
            id=row['id'],
            usuario_id=row['usuario_id'],
            curso_codigo=row['curso_codigo'],
            titulo=row['titulo'],
            descripcion=row['descripcion'] or "",
            tipo=row['tipo'],
            fecha_limite=datetime.strptime(row['fecha_limite'], '%Y-%m-%d %H:%M:%S'),
            hora_limite=row['hora_limite'],
            horas_estimadas=row['horas_estimadas'],
            dificultad=row['dificultad'],
            prioridad=row['prioridad'],
            completada=bool(row['completada']),
            porcentaje_completado=row['porcentaje_completado'],
            notas=row['notas'] or "",
            fecha_creacion=datetime.strptime(row['fecha_creacion'], '%Y-%m-%d %H:%M:%S'),
            fecha_completada=datetime.strptime(row['fecha_completada'], '%Y-%m-%d %H:%M:%S') if row.get('fecha_completada') else None
        )
    
    @classmethod
    def crear(cls, usuario_id: int, curso_codigo: str, titulo: str,
              descripcion: str, tipo: str, fecha_limite: str,
              horas_estimadas: float, dificultad: int,
              hora_limite: str = None) -> 'Tarea':
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        # Convertir fecha a datetime
        if ' ' not in fecha_limite:
            fecha_limite = f"{fecha_limite} 23:59:59"
        
        cursor.execute('''
        INSERT INTO tareas 
        (usuario_id, curso_codigo, titulo, descripcion, tipo, fecha_limite,
         hora_limite, horas_estimadas, dificultad, prioridad)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        ''', (usuario_id, curso_codigo, titulo, descripcion, tipo,
              fecha_limite, hora_limite, horas_estimadas, dificultad))
        
        tarea_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return cls.obtener_por_id(tarea_id)
    
    @classmethod
    def obtener_por_id(cls, tarea_id: int) -> Optional['Tarea']:
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM tareas WHERE id = ?', (tarea_id,))
        row = cursor.fetchone()
        conn.close()
        
        return cls.from_row(row) if row else None
    
    def marcar_completada(self, porcentaje: int = 100):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        UPDATE tareas 
        SET completada = 1, porcentaje_completado = ?, fecha_completada = CURRENT_TIMESTAMP
        WHERE id = ?
        ''', (porcentaje, self.id))
        
        conn.commit()
        conn.close()
        
        self.completada = True
        self.porcentaje_completado = porcentaje
    
    def actualizar_progreso(self, porcentaje: int):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        UPDATE tareas SET porcentaje_completado = ? WHERE id = ?
        ''', (porcentaje, self.id))
        
        conn.commit()
        conn.close()
        
        self.porcentaje_completado = porcentaje
    
    def eliminar(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM tareas WHERE id = ?', (self.id,))
        conn.commit()
        conn.close()
    
    def dias_restantes(self) -> int:
        delta = self.fecha_limite - datetime.now()
        return delta.days
    
    def __repr__(self):
        estado = "✓" if self.completada else "○"
        return f"{estado} {self.titulo} ({self.curso.nombre}) - {self.fecha_limite.date()}"


# ========== CALENDARIO ==========

class CalendarioInstitucional(DatabaseModel):
    """Calendario académico institucional"""
    
    def __init__(self, id: int, nombre_evento: str, descripcion: str,
                 fecha_inicio: datetime, fecha_fin: datetime,
                 tipo: str, semestre: str, icono: str, color: str):
        self.id = id
        self.nombre_evento = nombre_evento
        self.descripcion = descripcion
        self.fecha_inicio = fecha_inicio
        self.fecha_fin = fecha_fin
        self.tipo = tipo
        self.semestre = semestre
        self.icono = icono
        self.color = color
    
    @classmethod
    def from_row(cls, row):
        return cls(
            id=row['id'],
            nombre_evento=row['nombre_evento'],
            descripcion=row['descripcion'],
            fecha_inicio=datetime.strptime(row['fecha_inicio'], '%Y-%m-%d'),
            fecha_fin=datetime.strptime(row['fecha_fin'], '%Y-%m-%d') if row['fecha_fin'] else None,
            tipo=row['tipo'],
            semestre=row['semestre'],
            icono=row['icono'],
            color=row['color']
        )
    
    @classmethod
    def obtener_proximos(cls, dias: int = 60) -> List['CalendarioInstitucional']:
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        fecha_limite = (datetime.now() + timedelta(days=dias)).strftime('%Y-%m-%d')
        
        cursor.execute('''
        SELECT * FROM calendario_institucional 
        WHERE fecha_inicio >= date('now') AND fecha_inicio <= ?
        ORDER BY fecha_inicio ASC
        ''', (fecha_limite,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [cls.from_row(row) for row in rows]
    
    @classmethod
    def obtener_por_semestre(cls, semestre: str) -> List['CalendarioInstitucional']:
        conn = cls.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM calendario_institucional 
        WHERE semestre = ? OR semestre IS NULL
        ORDER BY fecha_inicio ASC
        ''', (semestre,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [cls.from_row(row) for row in rows]