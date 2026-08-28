package com.mes.common.config;

import javax.sql.DataSource;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

/**
 * ez_scada(sample_pro가 쓰는 기존 MariaDB, localhost)에 붙는 두 번째 DataSource/MyBatis 세션.
 * 기본 세션(db_ym_pro, MyBatisConfig)은 그대로 두고, 모니터링(알람/트렌드)·조건관리(센서/조절계) 중
 * 실데이터가 필요한 Dao 메서드에서만 "ezScadaSession"을 명시적으로 주입받아 골라 쓴다.
 */
@Configuration
public class EzScadaDataSourceConfig {

    @Bean
    @ConfigurationProperties("ezscada.datasource")
    public DataSourceProperties ezScadaDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    public DataSource ezScadaDataSource() {
        return ezScadaDataSourceProperties().initializeDataSourceBuilder().build();
    }

    // 파라미터 주입 대신 같은 @Configuration 클래스 안에서 직접 호출한다(CGLIB가 싱글턴을
    // 보장) — DataSource/SqlSessionFactory가 이제 2개씩이라 이름 기반 자동 매칭에 기대지 않기 위함.
    @Bean
    public SqlSessionFactory ezScadaSqlSessionFactory() throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(ezScadaDataSource());
        factoryBean.setTypeAliasesPackage("com.mes");
        factoryBean.setMapperLocations(
                new PathMatchingResourcePatternResolver().getResources("classpath:mapper/**/*.xml"));

        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        factoryBean.setConfiguration(configuration);

        return factoryBean.getObject();
    }

    @Bean(name = "ezScadaSession")
    public SqlSessionTemplate ezScadaSession() throws Exception {
        return new SqlSessionTemplate(ezScadaSqlSessionFactory());
    }
}
