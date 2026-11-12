package com.parkflash.repositorio;

import com.parkflash.dominio.Despesa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DespesaRepository extends JpaRepository<Despesa, Long> {

    List<Despesa> findAllByOrderByDataDescIdDesc();

    List<Despesa> findByDataBetweenOrderByDataDescIdDesc(LocalDate inicio, LocalDate fim);

    boolean existsByUnidadeId(Long unidadeId);
}
