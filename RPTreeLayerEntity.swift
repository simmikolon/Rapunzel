//
//  RPTreeLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 24.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

enum RPTreePlatformPosition: CGFloat {
    
    case Left = -320
    case Right = 320
}

class RPTreeLayerEntity: RPLayerEntity, RPResourceLoadableType {
    
    static var tileSize = CGSize(width: 1364, height: 192)
    static var tileAtlas: SKTextureAtlas!
    static var tileSet: RPTileSet!
    
    // MARK: - Components
    
    var tileComponent: RPTileComponent {
        guard let tileComponent = componentForClass(RPTileComponent) else { fatalError() }
        return tileComponent
    }
    
    // MARK: - Initialisation
    
    init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: RPCameraComponent, zPosition: CGFloat = 0.0, pattern: RPPattern) {
        
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent, zPosition: zPosition, pattern: pattern)
        
        let tileComponent = RPTileComponent(withEntity: self, tileSet: RPTreeLayerEntity.tileSet)
        addComponent(tileComponent)

        self.name = "RPTreeLayerEntity"
    }
}

extension RPTreeLayerEntity {
    
    static var resourcesNeedLoading: Bool {
        return tileAtlas == nil
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        tileAtlas = SKTextureAtlas(named: "RPTreeLayer")
        tileAtlas.preloadWithCompletionHandler { () -> Void in
            
            tileSet = RPTileComponent.tileSetFromAtlas(tileAtlas)
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        tileAtlas = nil
    }
    
}
