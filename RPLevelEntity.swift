//
//  RPLevel.swift
//  Rapunzel
//
//  Created by Simon Kemper on 03.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct RPLevelLayer {

    let name: String
    let creationHandler: (RPLevelEntity) -> RPLayerEntity
    let loadingHandler: (completionHandler: () -> ()) -> Void
}

class RPLevelEntity: GKEntity {
    
    // MARK: - DataSource

    var dataSource: RPLevelDataSource
    
    // MARK: - Level Components
    
    let renderComponent: RPRenderComponent
    let entityManagerComponent: RPEntityManagerComponent
    
    // MARK: - Constant Entities
    
    let playerEntity: RPPlayerEntity
    let cameraEntity: RPCameraEntity
    let playerLayerEntity: RPActionLayerEntity
    
    // MARK: - Initialisation
    
    init(withDataSource dataSource: RPLevelDataSource) {
        
        /* Assign Data Source */
        
        self.dataSource = dataSource
        
        /* Create Render Component */
        
        renderComponent = RPRenderComponent()
        
        /* Erstellen von Entity Manager */
        
        entityManagerComponent = RPEntityManagerComponent()
        
        /* Erstellen von RPPlayerEntity */
        
        playerEntity = RPPlayerEntity()
        playerEntity.renderComponent.node.zPosition = 60
        playerEntity.renderComponent.node.position = CGPoint(x: 0, y: 150)
        
        /* Camera Entity erstellen und Hinzufügen */
        
        cameraEntity = RPCameraEntity(withFocusedNode: playerEntity.renderComponent.node)
        
        /* Erstellen von RPActionLayerEntity */
        
        playerLayerEntity = RPActionLayerEntity(cameraComponent: cameraEntity.cameraComponent, zPosition: 5)
        playerLayerEntity.renderComponent.addChild(playerEntity.renderComponent.node)
        playerLayerEntity.renderComponent.addChild(cameraEntity.cameraComponent.cameraNode)
        renderComponent.addChild(playerLayerEntity.renderComponent.node)
        
        /* Initialize super class */
        
        super.init()
        
        addComponent(renderComponent)
        addComponent(entityManagerComponent)
        
        renderComponent.node.entity = self;
        
        /* Statische Entities hinzufügen */
        
        entityManagerComponent.addEntity(playerEntity)
        entityManagerComponent.addEntity(cameraEntity)
        entityManagerComponent.addEntity(playerLayerEntity)
        
        /* Level Layer erstellen und dieser Entity hinzufügen */
        
        for levelLayer in dataSource.levelLayers() {
            
            let levelLayerEntity = levelLayer.creationHandler(self)
            entityManagerComponent.addEntity(levelLayerEntity)
            renderComponent.node.addChild(levelLayerEntity.renderComponent.node)
        }
    }
}
