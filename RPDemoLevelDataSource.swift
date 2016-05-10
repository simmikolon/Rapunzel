//
//  RPDemoLevelDataSource.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

class RPDemoLevelDataSource: RPLevelDataSource {
    
    let _levelLayers: [RPLevelLayer]
    
    func levelLayers() -> [RPLevelLayer] {
        return _levelLayers
    }
    
    var loadableTypes: [RPResourceLoadableType.Type] = [
        
        RPHairLayerEntity.self,
        RPTowerLayerEntity.self,
        RPTreeLayerEntity.self,
        RPBackgroundLayerEntity.self,
        RPFarBackgroundLayerEntity.self,
        RPHairRibbonPlatformEntity.self,
        RPLeftBranchPlatformEntity.self,
        RPBranchPlatformEntity.self,
        RPPlayerEntity.self
    ]
    
    lazy var _pattern: RPPattern = {
        
        let pattern = RPPattern(withNumberOfBeats: 2)
        
        pattern.beats[0] = RPBeat(withType: .NotEmpty)
        pattern.beats[0].elements.append(RPBeatElement(type: .LeftTreePlatform) { (offset, entityManagerComponent) -> RPPlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "RPHairLayerEntity") as? RPLayerEntity else {
                fatalError()
            }
            
            let platform = RPHairRibbonPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 20
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        
        pattern.beats[0].elements.append(RPBeatElement(type: .LeftTreePlatform) { (offset, entityManagerComponent) -> RPPlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "RPTreeLayerEntity") as? RPLayerEntity else {
                fatalError()
            }
            
            let platform = RPLeftBranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = 320
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        
        /**/
        
        pattern.beats[1] = RPBeat(withType: .NotEmpty)
        pattern.beats[1].elements.append(RPBeatElement(type: .LeftTreePlatform) { (offset, entityManagerComponent) -> RPPlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "RPHairLayerEntity") as? RPLayerEntity else {
                fatalError()
            }
            
            let platform = RPHairRibbonPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -20
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        
        pattern.beats[1].elements.append(RPBeatElement(type: .LeftTreePlatform) { (offset, entityManagerComponent) -> RPPlatformEntity in
            
            guard let layerEntity = entityManagerComponent.entity(withName: "RPTreeLayerEntity") as? RPLayerEntity else {
                fatalError()
            }
            
            let platform = RPBranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
            platform.renderComponent.node.position.x = -320
            platform.renderComponent.node.position.y = offset
            platform.renderComponent.node.zPosition = 1
            platform.delegate = entityManagerComponent
            entityManagerComponent.addEntity(platform)
            layerEntity.renderComponent.addChild(platform.renderComponent.node)
            return platform
            
            })
        
        return pattern
    }()
    
    func demoPattern() -> RPPattern {
        
        return _pattern
    }
    
    init() {
        
        _levelLayers = [
            
            RPLevelLayer(name: "ASD", creationHandler: { (cameraComponent) -> RPLayerEntity in

                let layerEntity = RPHairLayerEntity(withParallaxFactor: 2.0, cameraComponent: cameraComponent, zPosition: -1)
                layerEntity.name = "RPHairLayerEntity"
                return layerEntity
                
            }),
            
            RPLevelLayer(name: "ASD", creationHandler: { (cameraComponent) -> RPLayerEntity in
                
                let layerEntity = RPTowerLayerEntity(withParallaxFactor: 2.0, cameraComponent: cameraComponent, zPosition: -2)
                layerEntity.name = "RPTowerLayerEntity"
                return layerEntity
                
            }),
            
            RPLevelLayer(name: "ASD", creationHandler: { (cameraComponent) -> RPLayerEntity in

                let layerEntity = RPTreeLayerEntity(withParallaxFactor: 1.5, cameraComponent: cameraComponent, zPosition: 1)
                layerEntity.name = "RPTreeLayerEntity"
                return layerEntity
                
            }),
            
            RPLevelLayer(name: "ASD", creationHandler: { (cameraComponent) -> RPLayerEntity in
                
                let layerEntity = RPBackgroundLayerEntity(withParallaxFactor: 3.0, cameraComponent: cameraComponent, zPosition: -3)
                layerEntity.name = "RPBackgroundLayerEntity"
                return layerEntity
                
            }),
            
            RPLevelLayer(name: "ASD", creationHandler: { (cameraComponent) -> RPLayerEntity in
                
                let layerEntity = RPFarBackgroundLayerEntity(withParallaxFactor: 8.0, cameraComponent: cameraComponent, zPosition: -5)
                layerEntity.name = "RPFarBackgroundLayerEntity"
                return layerEntity
                
            })
        ]
    }
}