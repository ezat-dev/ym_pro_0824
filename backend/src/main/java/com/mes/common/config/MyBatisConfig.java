package com.mes.common.config;

import javax.sql.DataSource;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import com.zaxxer.hikari.HikariDataSource;

/**
 * db_ym_pro(기본 스키마)용 DataSource/SqlSessionFactory/Template. ez_scada용 두 번째 세션은
 * EzScadaDataSourceConfig 참고. DataSource가 2개가 되면서 스프링 부트 자동설정 하나 + 수동
 * 빈 하나를 섞으면 이름 매칭이 불안정해지므로(-parameters 컴파일 플래그 없이는 자동 매칭도 안 됨),
 * 여기서 DataSource까지 직접 정의하고 전부 @Primary로 고정해 기존 Dao(BaseDaoImpl 등, 전부
 * 한정자 없는 SqlSessionTemplate 주입)가 계속 db_ym_pro를 보도록 한다. application.yml의
 * spring.datasource.* 프로퍼티는 그대로 재사용(프리픽스만 유지, 자동설정 대신 여기서 직접 바인딩).
 */
@Configuration
public class MyBatisConfig {

    @Primary
    @Bean
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        return new DataSourceProperties();
    }

    @Primary
    @Bean
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource dataSource() {
        return dataSourceProperties().initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    @Primary
    @Bean
    public SqlSessionFactory sqlSessionFactory() throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource((DataSource) dataSource());
        factoryBean.setTypeAliasesPackage("com.mes");
        factoryBean.setMapperLocations(
                new PathMatchingResourcePatternResolver().getResources("classpath:mapper/**/*.xml"));

        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        factoryBean.setConfiguration(configuration);

        return factoryBean.getObject();
    }

    @Primary
    @Bean
    public SqlSessionTemplate sqlSessionTemplate() throws Exception {
        return new SqlSessionTemplate(sqlSessionFactory());
    }
}
