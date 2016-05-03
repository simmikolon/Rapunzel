//
//  RPHairLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPHairLayerEntity: RPLayerEntity, RPResourceLoadableType {
    
    static var tileSize = CGSize(width: 1364, height: 192)
    static var atlas: SKTextureAtlas!
    static var tileSet: RPTileSet!
    
    // MARK: Components
    
    var tileComponent: RPTileComponent!
    
    // MARK: Initialisation
    
    override init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: RPCameraComponent, zPosition: CGFloat = 0.0) {
        
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent, zPosition: zPosition)
        
        self.tileComponent = RPTileComponent(withEntity: self, tileSet: RPHairLayerEntity.tileSet, offset: 250.0)
        
        addComponent(self.tileComponent)
        
        self.name = "RPHairLayerEntity"
    }
}

extension RPHairLayerEntity {
    
    static var resourcesNeedLoading: Bool {
        return true
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        atlas = SKTextureAtlas(named: "RPHairLayer")
        atlas.preloadWithCompletionHandler { () -> Void in
            
            tileSet = RPTileComponent.tileSetFromAtlas(atlas)
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        atlas = nil
    }
}